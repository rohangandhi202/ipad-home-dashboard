// Govee developer API: https://developer.govee.com/reference/control-you-devices
// The account limit is 10,000 requests a day, so state is cached for a short time and the
// device list (name -> sku/id) for an hour.

const BASE = 'https://openapi.api.govee.com/router/api/v1';
const STATE_TTL_MS = 25_000;
const DEVICE_LIST_TTL_MS = 60 * 60 * 1000;

// Lives as long as this Worker instance; a cold start just means a few extra Govee calls.
const cache = { devices: null, devicesAt: 0, state: new Map(), blockedUntil: 0 };

class GoveeError extends Error {}

async function call(env, path, payload) {
  if (Date.now() < cache.blockedUntil) throw new GoveeError('Govee rate limit hit; try again soon');
  if (!env.GOVEE_API_KEY) throw new GoveeError('GOVEE_API_KEY secret is not set');

  const res = await fetch(`${BASE}${path}`, {
    method: payload ? 'POST' : 'GET',
    headers: { 'Govee-API-Key': env.GOVEE_API_KEY, 'Content-Type': 'application/json' },
    body: payload && JSON.stringify({ requestId: crypto.randomUUID(), payload }),
  });
  if (res.status === 429) {
    const reset = Number(res.headers.get('API-RateLimit-Reset') ?? res.headers.get('X-RateLimit-Reset'));
    cache.blockedUntil = reset ? reset * 1000 : Date.now() + 60_000;
    throw new GoveeError('Govee rate limit hit; try again soon');
  }
  if (res.status === 401 || res.status === 403) {
    throw new GoveeError('Govee rejected the API key; check the GOVEE_API_KEY secret');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.code && data.code !== 200)) {
    throw new GoveeError(`Govee said: ${data.msg ?? data.message ?? res.status}`);
  }
  return data;
}

async function listDevices(env) {
  if (!cache.devices || Date.now() - cache.devicesAt > DEVICE_LIST_TTL_MS) {
    cache.devices = (await call(env, '/user/devices')).data ?? [];
    cache.devicesAt = Date.now();
  }
  return cache.devices;
}

// Dashboard devices are matched to Govee devices by the name shown in the Govee Home app.
async function findDevice(env, device) {
  const wanted = (device.goveeName ?? device.name).trim().toLowerCase();
  const devices = await listDevices(env);
  const match = devices.find((d) => d.deviceName?.trim().toLowerCase() === wanted);
  if (!match) {
    const names = devices.map((d) => `"${d.deviceName}"`).join(', ') || 'none';
    throw new GoveeError(`No Govee device named "${device.goveeName ?? device.name}". Govee has: ${names}`);
  }
  return match;
}

export async function getState(env, device) {
  const cached = cache.state.get(device.id);
  if (cached && Date.now() - cached.at < STATE_TTL_MS) return cached.on;

  const { sku, device: id } = await findDevice(env, device);
  const { payload } = await call(env, '/device/state', { sku, device: id });
  const power = payload?.capabilities?.find((c) => c.instance === 'powerSwitch');
  const on = power ? power.state?.value === 1 : null;
  cache.state.set(device.id, { on, at: Date.now() });
  return on;
}

export async function setPower(env, device, on) {
  const { sku, device: id } = await findDevice(env, device);
  await call(env, '/device/control', {
    sku,
    device: id,
    capability: { type: 'devices.capabilities.on_off', instance: 'powerSwitch', value: on ? 1 : 0 },
  });
  // Govee's state endpoint can lag a few seconds behind a command, so trust what we just sent.
  cache.state.set(device.id, { on, at: Date.now() });
}
