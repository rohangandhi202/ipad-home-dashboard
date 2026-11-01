// Everything about your apartment lives here: devices, TV shortcuts, scenes.
// This file is public (it's served by GitHub Pages), so never put keys or tokens in it.

export default {
  location: {
    // 30350 (Sandy Springs / Dunwoody, GA), rounded so it's neighborhood-level only.
    latitude: 33.95,
    longitude: -84.36,
    temperatureUnit: 'fahrenheit',
  },

  // via: how the cloud helper reaches the device.
  //   govee    - Govee API (live on/off state)
  //   tuya     - Smart Life / Tuya cloud API (live on/off state)
  //   alexa    - Voice Monkey -> Alexa routine (no state; shows the last thing the dashboard did)
  //   shortcut - Siri Shortcut run on the iPad itself (no state)
  // goveeName: the device's name in the Govee Home app, when it differs from `name`.
  devices: [
    { id: 'desk-light', name: 'Desk light', type: 'light', icon: 'ti-bulb', via: 'govee', goveeName: 'Desk Lights' },
    { id: 'tv-light', name: 'TV light', type: 'light', icon: 'ti-device-tv', via: 'govee' },
    { id: 'lamp', name: 'Lamp', type: 'light', icon: 'ti-lamp', via: 'tuya' },
    {
      id: 'sunset', name: 'Sunset lamp', type: 'light', icon: 'ti-sunset-2', via: 'shortcut',
      shortcuts: { on: 'Sunset Lamp On', off: 'Sunset Lamp Off' },
    },
    { id: 'plug-tv-stand', name: 'TV Stand', type: 'plug', icon: 'ti-plug', via: 'tuya' },
    { id: 'plug-desk', name: 'Desk', type: 'plug', icon: 'ti-plug', via: 'tuya' },
    { id: 'plug-counter', name: 'Counter', type: 'plug', icon: 'ti-plug', via: 'tuya' },
    { id: 'fire-tv', name: 'Fire TV', type: 'tv', icon: 'ti-device-tv', via: 'alexa' },
  ],

  tv: {
    apps: [
      { id: 'netflix', name: 'Netflix' },
      { id: 'youtube', name: 'YouTube' },
      { id: 'hulu', name: 'Hulu' },
      { id: 'prime-video', name: 'Prime Video' },
      { id: 'spotify', name: 'Spotify' },
      { id: 'apple-tv', name: 'Apple TV' },
    ],
    inputs: [
      { id: 'ps5', name: 'PS5', input: 'HDMI 2', icon: 'ti-device-gamepad-2' },
    ],
  },

  // `set` targets, from weakest to strongest: '*' (every device), 'lights' / 'plugs' (by type),
  // then a device id. `tv` optionally opens an app or switches input after the devices are set.
  scenes: [
    { id: 'leaving', name: 'Leaving', icon: 'ti-door-exit', set: { '*': 'off', 'plug-tv-stand': 'on' } },
    {
      id: 'bed', name: 'Bed', icon: 'ti-bed',
      set: { lights: 'off', 'fire-tv': 'off', 'plug-desk': 'on', 'plug-counter': 'off' },
    },
    {
      id: 'gaming', name: 'Gaming', icon: 'ti-device-gamepad-2',
      set: { 'tv-light': 'on', lamp: 'on', 'fire-tv': 'on' },
      tv: { input: 'ps5' },
    },
    { id: 'vacation', name: 'Vacation', icon: 'ti-plane', set: { '*': 'off' } },
    { id: 'all-on', name: 'All on', icon: 'ti-bulb', set: { lights: 'on', plugs: 'on' } },
    { id: 'all-off', name: 'All off', icon: 'ti-power', set: { '*': 'off' } },
  ],

  display: {
    // Screen dims between these times; touching it brightens it for a couple of minutes.
    dimFrom: '23:00',
    dimUntil: '07:00',
    // Reloads once a night so the iPad picks up changes pushed to GitHub.
    reloadAt: '04:00',
  },
};
