// The dashboard's cloud helper. Holds every device key and speaks to each maker's API, so the
// public dashboard only ever needs the access code saved on the iPad.
//
//   GET  /state         -> { devices: { [id]: { on } } } for devices that report state
//   POST /devices/:id   { on: true|false }
//   POST /scenes/:id    -> { failed: [{ id, error }], skipped: [id] }
//   POST /tv            { app } or { input }

import config from '../../site/home-config.js';
import { resolveScene } from '../../site/scenes.js';
import * as govee from './govee.js';
import * as tuya from './tuya.js';

// Filled in as each phase lands: alexa (phase 4).
const providers = { govee, tuya };

const deviceById = new Map(config.devices.map((d) => [d.id, d]));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function providerFor(device) {
  const provider = providers[device.via];
  if (!provider) throw new HttpError(501, `${device.name} isn't connected yet`);
  return provider;
}

async function getState(env) {
  const devices = {};
  await Promise.all(config.devices.map(async (device) => {
    const provider = providers[device.via];
    if (!provider?.getState) return;
    try {
      devices[device.id] = { on: await provider.getState(env, device) };
    } catch (err) {
      console.error(device.id, err.message);
    }
  }));
  return { devices };
}

async function setDevice(env, id, body) {
  const device = deviceById.get(id);
  if (!device) throw new HttpError(404, `Unknown device: ${id}`);
  if (typeof body?.on !== 'boolean') throw new HttpError(400, 'Send { "on": true } or { "on": false }');
  await providerFor(device).setPower(env, device, body.on);
}

async function runScene(env, sceneId) {
  if (!config.scenes.some((s) => s.id === sceneId)) throw new HttpError(404, `Unknown scene: ${sceneId}`);
  const { targets } = resolveScene(config, sceneId);
  const failed = [];
  const skipped = [];

  await Promise.all(Object.entries(targets).map(async ([id, on]) => {
    const device = deviceById.get(id);
    // Shortcut devices are run by the iPad itself.
    if (device.via === 'shortcut') return;
    const provider = providers[device.via];
    if (!provider) return skipped.push(id);
    try {
      await provider.setPower(env, device, on);
    } catch (err) {
      failed.push({ id, error: err.message });
    }
  }));
  // The TV part of a scene (app or input) arrives with the Alexa bridge in phase 4.
  return { failed, skipped };
}

async function route(request, env) {
  const { pathname } = new URL(request.url);
  const body = request.method === 'POST' ? await request.json().catch(() => ({})) : null;

  if (request.method === 'GET' && pathname === '/state') return getState(env);

  let match = pathname.match(/^\/devices\/([\w-]+)$/);
  if (request.method === 'POST' && match) return setDevice(env, match[1], body);

  match = pathname.match(/^\/scenes\/([\w-]+)$/);
  if (request.method === 'POST' && match) return runScene(env, match[1]);

  if (request.method === 'POST' && pathname === '/tv') throw new HttpError(501, "The Fire TV isn't connected yet");

  throw new HttpError(404, 'Not found');
}

/* ---------- Access code and CORS ---------- */

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim());
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

async function authorized(request, env) {
  if (!env.DASHBOARD_TOKEN) return false;
  const given = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  // Compare digests so the check takes the same time however much of the code is right.
  const digest = async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [a, b] = await Promise.all([digest(given), digest(env.DASHBOARD_TOKEN)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

const json = (data, status, headers) => new Response(data == null ? null : JSON.stringify(data), {
  status: data == null ? 204 : status,
  headers: { ...headers, ...(data != null && { 'Content-Type': 'application/json' }) },
});

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!(await authorized(request, env))) return json({ error: 'Wrong access code' }, 401, cors);

    try {
      return json(await route(request, env), 200, cors);
    } catch (err) {
      if (!(err instanceof HttpError)) console.error(err);
      return json({ error: err.message }, err.status ?? 502, cors);
    }
  },
};
