// Voice Monkey v3: https://voicemonkey.io/docs/api/trigger
// Each "Routine Trigger" device fires one Alexa routine. Alexa can't report back, so there's no
// getState here; the dashboard shows the last thing it asked for.
// The free plan allows 200 triggers a month, so nothing here retries or polls.

const TRIGGER_URL = 'https://api-v3.voicemonkey.io/trigger';

class VoiceMonkeyError extends Error {}

export async function trigger(env, triggerId, label) {
  if (!triggerId) throw new VoiceMonkeyError(`The Voice Monkey trigger for ${label} isn't set up yet`);
  if (!env.VOICE_MONKEY_TOKEN) throw new VoiceMonkeyError('VOICE_MONKEY_TOKEN secret is not set');

  const res = await fetch(TRIGGER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: env.VOICE_MONKEY_TOKEN, device: triggerId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new VoiceMonkeyError(`Voice Monkey said: ${data.error ?? data.message ?? data.data ?? res.status}`);
  }
}

export async function setPower(env, device, on) {
  await trigger(env, device.voiceMonkey?.[on ? 'on' : 'off'], `${device.name} ${on ? 'on' : 'off'}`);
}
