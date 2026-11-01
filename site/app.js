import config from './home-config.js';
import { resolveScene } from './scenes.js';

const $ = (id) => document.getElementById(id);
const deviceById = new Map(config.devices.map((d) => [d.id, d]));

// Devices that can't report their own state (Alexa, Shortcuts) remember what we last told them.
const LAST_SET_KEY = 'lastSet';
const SETTINGS_KEY = 'settings';
const POLL_MS = 5000;

const storage = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: keep going */ }
  },
};

const state = {
  on: Object.fromEntries(config.devices.map((d) => [d.id, false])),
  pending: new Set(),
};
Object.assign(state.on, storage.get(LAST_SET_KEY, {}));

function hasLiveState(device) {
  return device.via === 'govee' || device.via === 'tuya';
}

/* ---------- Backends ---------- */

// Demo mode: nothing leaves the iPad, so the layout can be tried before any accounts exist.
const demoBackend = {
  name: 'demo',
  async getState() { return null; },
  async setDevice() {},
  async runScene() {},
  async tv() {},
};

// The Cloudflare Worker added in phase 2. Every call carries the access code saved on this iPad.
function workerBackend(baseUrl, token) {
  const call = async (path, body) => {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, ...(body && { 'Content-Type': 'application/json' }) },
      body: body && JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Cloud helper returned ${res.status}`);
    return res.status === 204 ? null : res.json();
  };
  return {
    name: 'worker',
    async getState() { return (await call('/state')).devices; },
    async setDevice(id, on) { await call(`/devices/${id}`, { on }); },
    async runScene(id) { await call(`/scenes/${id}`, {}); },
    async tv(action) { await call('/tv', action); },
  };
}

function loadBackend() {
  const { url, token } = storage.get(SETTINGS_KEY, {});
  return url && token ? workerBackend(url, token) : demoBackend;
}

let backend = loadBackend();

/* ---------- Shortcuts (sunset lamp) ---------- */

// Opening a shortcuts:// link hands the iPad to the Shortcuts app; each Shortcut ends by
// opening the dashboard again. Only one can run per tap, so scenes use at most one.
function runShortcut(device, on) {
  const name = device.shortcuts?.[on ? 'on' : 'off'];
  if (!name || backend.name === 'demo') return;
  window.location.href = `shortcuts://run-shortcut?name=${encodeURIComponent(name)}`;
}

/* ---------- Rendering ---------- */

function tileHtml(device) {
  return `
    <button class="tile" data-id="${device.id}" aria-pressed="false">
      <i class="ti ${device.icon}" aria-hidden="true"></i>
      ${hasLiveState(device) ? '' : '<span class="tile-badge" title="Shows the last thing the dashboard did">last set</span>'}
      <span>
        <span class="tile-name">${device.name}</span><br>
        <span class="tile-state">Off</span>
      </span>
    </button>`;
}

function render() {
  $('scenes').innerHTML = config.scenes.map((s) => `
    <button class="scene" data-scene="${s.id}">
      <i class="ti ${s.icon}" aria-hidden="true"></i>${s.name}
    </button>`).join('');

  $('lights').innerHTML = config.devices.filter((d) => d.type === 'light').map(tileHtml).join('');
  $('plugs').innerHTML = config.devices.filter((d) => d.type === 'plug').map(tileHtml).join('');

  const tvTiles = config.devices.filter((d) => d.type === 'tv').map(tileHtml);
  const inputTiles = config.tv.inputs.map((input) => `
    <button class="tile" data-input="${input.id}">
      <i class="ti ${input.icon}" aria-hidden="true"></i>
      <span>
        <span class="tile-name">${input.name}</span><br>
        <span class="tile-state">Switch to ${input.input}</span>
      </span>
    </button>`);
  $('tv-tiles').innerHTML = [...tvTiles, ...inputTiles].join('');

  $('tv-apps').innerHTML = config.tv.apps
    .map((app) => `<button class="app" data-app="${app.id}">${app.name}</button>`).join('');

  updateTiles();
}

function updateTiles() {
  for (const tile of document.querySelectorAll('.tile[data-id]')) {
    const id = tile.dataset.id;
    const on = state.on[id];
    tile.setAttribute('aria-pressed', String(on === true));
    tile.classList.toggle('pending', state.pending.has(id));
    tile.querySelector('.tile-state').textContent = on == null ? 'Unknown' : on ? 'On' : 'Off';
  }
}

function setStatus(text, isError = false) {
  const el = $('status');
  el.textContent = text;
  el.classList.toggle('error', isError);
}

let toastTimer;
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ---------- Actions ---------- */

function remember(targets) {
  const lastSet = storage.get(LAST_SET_KEY, {});
  for (const [id, on] of Object.entries(targets)) {
    if (!hasLiveState(deviceById.get(id))) lastSet[id] = on;
  }
  storage.set(LAST_SET_KEY, lastSet);
}

async function toggleDevice(id) {
  const device = deviceById.get(id);
  const next = !state.on[id];
  const previous = state.on[id];

  state.on[id] = next;
  state.pending.add(id);
  updateTiles();
  try {
    if (device.via === 'shortcut') runShortcut(device, next);
    else await backend.setDevice(id, next);
    remember({ [id]: next });
  } catch (err) {
    state.on[id] = previous;
    toast(`Couldn't reach ${device.name}`);
    console.error(err);
  } finally {
    state.pending.delete(id);
    updateTiles();
  }
}

async function runScene(sceneId, button) {
  const scene = config.scenes.find((s) => s.id === sceneId);
  const { targets } = resolveScene(config, sceneId);
  const previous = { ...state.on };

  Object.assign(state.on, targets);
  button.classList.add('busy');
  updateTiles();
  try {
    await backend.runScene(sceneId);
    remember(targets);
    toast(`${scene.name} scene on`);
    const shortcutDevice = Object.keys(targets)
      .map((id) => deviceById.get(id))
      .find((d) => d.via === 'shortcut');
    if (shortcutDevice) runShortcut(shortcutDevice, targets[shortcutDevice.id]);
  } catch (err) {
    state.on = previous;
    toast(`Couldn't run ${scene.name}`);
    console.error(err);
  } finally {
    button.classList.remove('busy');
    updateTiles();
  }
}

async function tvAction(action, label) {
  try {
    await backend.tv(action);
    state.on['fire-tv'] = true;
    remember({ 'fire-tv': true });
    updateTiles();
    toast(label);
  } catch (err) {
    toast("Couldn't reach the Fire TV");
    console.error(err);
  }
}

document.addEventListener('click', (event) => {
  const tile = event.target.closest('.tile[data-id]');
  if (tile) return toggleDevice(tile.dataset.id);

  const scene = event.target.closest('[data-scene]');
  if (scene) return runScene(scene.dataset.scene, scene);

  const app = event.target.closest('[data-app]');
  if (app) {
    const { name } = config.tv.apps.find((a) => a.id === app.dataset.app);
    return tvAction({ app: app.dataset.app }, `Opening ${name}`);
  }

  const input = event.target.closest('[data-input]');
  if (input) {
    const { name, input: port } = config.tv.inputs.find((i) => i.id === input.dataset.input);
    return tvAction({ input: input.dataset.input }, `Switching to ${name} (${port})`);
  }
});

/* ---------- Live state ---------- */

async function refreshState() {
  if (backend.name === 'demo') {
    setStatus('Demo mode');
    return;
  }
  try {
    const devices = await backend.getState();
    for (const [id, { on }] of Object.entries(devices ?? {})) {
      if (!state.pending.has(id) && deviceById.has(id)) state.on[id] = on;
    }
    setStatus('');
    updateTiles();
  } catch (err) {
    setStatus('Offline', true);
    console.error(err);
  }
}

/* ---------- Clock and weather ---------- */

function tickClock() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .formatToParts(now);
  $('time').textContent = parts.filter((p) => p.type !== 'dayPeriod').map((p) => p.value).join('').trim();
  $('ampm').textContent = parts.find((p) => p.type === 'dayPeriod')?.value.toLowerCase() ?? '';
  $('date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  updateNight(now);
  maybeReload(now);
}

function weatherLook(code, isDay) {
  if (code === 0) return [isDay ? 'ti-sun' : 'ti-moon', 'Clear'];
  if (code <= 2) return ['ti-cloud', 'Partly cloudy'];
  if (code === 3) return ['ti-cloud', 'Cloudy'];
  if (code <= 48) return ['ti-mist', 'Foggy'];
  if (code <= 67 || (code >= 80 && code <= 82)) return ['ti-cloud-rain', code <= 57 ? 'Drizzle' : 'Rain'];
  if (code <= 77 || code === 85 || code === 86) return ['ti-snowflake', 'Snow'];
  return ['ti-cloud-storm', 'Thunderstorms'];
}

async function refreshWeather() {
  const { latitude, longitude, temperatureUnit } = config.location;
  const url = 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${latitude}&longitude=${longitude}`
    + '&current=temperature_2m,weather_code,is_day'
    + '&daily=temperature_2m_max,temperature_2m_min'
    + `&temperature_unit=${temperatureUnit}&timezone=auto&forecast_days=1`;
  try {
    const data = await (await fetch(url)).json();
    const [icon, text] = weatherLook(data.current.weather_code, data.current.is_day);
    $('weather-icon').className = `ti ${icon}`;
    $('weather-temp').textContent = `${Math.round(data.current.temperature_2m)}°`;
    $('weather-text').textContent = text;
    $('weather-range').textContent =
      `H ${Math.round(data.daily.temperature_2m_max[0])}°  L ${Math.round(data.daily.temperature_2m_min[0])}°`;
  } catch (err) {
    $('weather-text').textContent = 'Weather unavailable';
    console.error(err);
  }
}

/* ---------- Night dimming and nightly reload ---------- */

const minutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
let wakeUntil = 0;

function updateNight(now) {
  const t = now.getHours() * 60 + now.getMinutes();
  const from = minutes(config.display.dimFrom);
  const until = minutes(config.display.dimUntil);
  const inWindow = from > until ? t >= from || t < until : t >= from && t < until;
  $('night').classList.toggle('on', inWindow && Date.now() > wakeUntil);
}

document.addEventListener('pointerdown', () => {
  wakeUntil = Date.now() + 2 * 60 * 1000;
  updateNight(new Date());
}, { capture: true });

const loadedAt = Date.now();
function maybeReload(now) {
  const t = now.getHours() * 60 + now.getMinutes();
  const hoursUp = (Date.now() - loadedAt) / 3.6e6;
  if (t === minutes(config.display.reloadAt) && hoursUp > 1) window.location.reload();
}

/* ---------- Settings (press and hold the clock) ---------- */

let holdTimer;
$('clock').addEventListener('pointerdown', () => {
  holdTimer = setTimeout(openSettings, 800);
});
for (const type of ['pointerup', 'pointerleave', 'pointercancel']) {
  $('clock').addEventListener(type, () => clearTimeout(holdTimer));
}

function openSettings() {
  const { url = '', token = '' } = storage.get(SETTINGS_KEY, {});
  $('setting-url').value = url;
  $('setting-token').value = token;
  $('settings').showModal();
}

$('settings').addEventListener('close', () => {
  if ($('settings').returnValue !== 'save') return;
  storage.set(SETTINGS_KEY, {
    url: $('setting-url').value.trim(),
    token: $('setting-token').value.trim(),
  });
  backend = loadBackend();
  toast(backend.name === 'demo' ? 'Demo mode' : 'Connected to cloud helper');
  refreshState();
});

/* ---------- Start ---------- */

render();
tickClock();
refreshWeather();
refreshState();
setInterval(tickClock, 1000);
setInterval(refreshWeather, 15 * 60 * 1000);
setInterval(refreshState, POLL_MS);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { refreshState(); refreshWeather(); }
});
