// Tuya cloud API (Smart Life devices): https://developer.tuya.com/en/docs/cloud
// The free trial allows roughly 30,000 calls a month (~1,000 a day), so one call fetches every
// device with its state, and the result is kept in KV for two minutes. KV survives Worker
// restarts, which in-memory caching alone wouldn't.

const BASE = 'https://openapi.tuyaus.com'; // Western America data center
const SNAPSHOT_TTL_MS = 2 * 60 * 1000;
const TOKEN_KEY = 'tuya:token';
const SNAPSHOT_KEY = 'tuya:devices';
// Status codes that mean "power" across bulbs, lamps and plugs, in order of preference.
const SWITCH_CODES = ['switch_led', 'switch_1', 'switch', 'switch_on'];
const TOKEN_INVALID = 1010;

class TuyaError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function sha256Hex(text) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

async function hmacUpper(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))).toUpperCase();
}

// Every request is signed: HMAC-SHA256 over client id, token, time, nonce and the request itself.
async function request(env, method, path, body, token = '') {
  if (!env.TUYA_ACCESS_ID || !env.TUYA_ACCESS_SECRET) {
    throw new TuyaError('TUYA_ACCESS_ID / TUYA_ACCESS_SECRET secrets are not set');
  }
  const t = Date.now().toString();
  const nonce = crypto.randomUUID();
  const bodyText = body ? JSON.stringify(body) : '';
  const stringToSign = [method, await sha256Hex(bodyText), '', path].join('\n');
  const sign = await hmacUpper(env.TUYA_ACCESS_SECRET, env.TUYA_ACCESS_ID + token + t + nonce + stringToSign);

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      client_id: env.TUYA_ACCESS_ID,
      sign,
      t,
      nonce,
      sign_method: 'HMAC-SHA256',
      ...(token && { access_token: token }),
      ...(body && { 'Content-Type': 'application/json' }),
    },
    body: bodyText || undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!data.success) throw new TuyaError(`Smart Life said: ${data.msg ?? res.status} (${data.code})`, data.code);
  return data.result;
}

async function getToken(env, { fresh = false } = {}) {
  if (!fresh) {
    const cached = await env.CACHE.get(TOKEN_KEY, 'json');
    if (cached && cached.expiresAt > Date.now()) return cached.token;
  }
  const result = await request(env, 'GET', '/v1.0/token?grant_type=1');
  // Refresh five minutes early so a request never goes out with a token about to expire.
  const ttl = Math.max(60, result.expire_time - 300);
  await env.CACHE.put(TOKEN_KEY, JSON.stringify({ token: result.access_token, expiresAt: Date.now() + ttl * 1000 }), {
    expirationTtl: ttl,
  });
  return result.access_token;
}

async function authed(env, method, path, body) {
  try {
    return await request(env, method, path, body, await getToken(env));
  } catch (err) {
    if (err.code !== TOKEN_INVALID) throw err;
    return request(env, method, path, body, await getToken(env, { fresh: true }));
  }
}

async function fetchSnapshot(env) {
  const result = await authed(env, 'GET', '/v1.0/iot-01/associated-users/devices?size=100');
  const devices = (result.devices ?? []).map(({ id, name, status }) => ({ id, name, status }));

  // Older responses leave out status; fill it in with one batch call.
  const missing = devices.filter((d) => !Array.isArray(d.status));
  if (missing.length) {
    const statuses = await authed(env, 'GET', `/v1.0/devices/status?device_ids=${missing.map((d) => d.id).join(',')}`);
    for (const { id, status } of statuses ?? []) {
      const device = devices.find((d) => d.id === id);
      if (device) device.status = status;
    }
  }
  return { at: Date.now(), devices };
}

// One in-flight fetch shared by every tile asking at the same moment.
let pending = null;

async function snapshot(env) {
  const cached = await env.CACHE.get(SNAPSHOT_KEY, 'json');
  if (cached && Date.now() - cached.at < SNAPSHOT_TTL_MS) return cached;

  pending ??= fetchSnapshot(env)
    .then(async (fresh) => {
      await env.CACHE.put(SNAPSHOT_KEY, JSON.stringify(fresh), { expirationTtl: 600 });
      return fresh;
    })
    .finally(() => { pending = null; });
  return pending;
}

async function findDevice(env, device) {
  const wanted = (device.tuyaName ?? device.name).trim().toLowerCase();
  const { devices } = await snapshot(env);
  const match = devices.find((d) => d.name?.trim().toLowerCase() === wanted);
  if (!match) {
    const names = devices.map((d) => `"${d.name}"`).join(', ') || 'none';
    throw new TuyaError(`No Smart Life device named "${device.tuyaName ?? device.name}". Smart Life has: ${names}`);
  }
  return match;
}

function switchStatus(match) {
  return SWITCH_CODES.map((code) => match.status?.find((s) => s.code === code)).find(Boolean);
}

export async function getState(env, device) {
  const status = switchStatus(await findDevice(env, device));
  return status ? status.value === true : null;
}

export async function setPower(env, device, on) {
  const match = await findDevice(env, device);
  const code = switchStatus(match)?.code ?? 'switch_1';
  await authed(env, 'POST', `/v1.0/devices/${match.id}/commands`, { commands: [{ code, value: on }] });

  // Record the change so the next status check doesn't flip the tile back before Tuya catches up.
  // Chained so a scene switching several devices at once doesn't overwrite its own updates.
  updates = updates.then(async () => {
    const current = await snapshot(env);
    const status = switchStatus(current.devices.find((d) => d.id === match.id) ?? {});
    if (!status) return;
    status.value = on;
    await env.CACHE.put(SNAPSHOT_KEY, JSON.stringify(current), { expirationTtl: 600 });
  }).catch((err) => console.error('tuya cache update', err.message));
  await updates;
}

let updates = Promise.resolve();
