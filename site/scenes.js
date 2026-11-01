// Turns a scene into the on/off target for each device it touches.
// Shared with the cloud helper later, so it must not touch the DOM.

const TYPE_GROUPS = { lights: 'light', plugs: 'plug' };

export function resolveScene(config, sceneId) {
  const scene = config.scenes.find((s) => s.id === sceneId);
  if (!scene) throw new Error(`Unknown scene: ${sceneId}`);

  const targets = {};
  for (const device of config.devices) {
    if (device.scenes === false) continue;
    const group = Object.keys(TYPE_GROUPS).find((g) => TYPE_GROUPS[g] === device.type);
    const value = scene.set[device.id] ?? (group && scene.set[group]) ?? scene.set['*'];
    if (value) targets[device.id] = value === 'on';
  }
  return { targets, tv: scene.tv ?? null };
}
