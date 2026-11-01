# Fire TV and PS5 through Alexa (Voice Monkey)

Alexa doesn't let outside apps control your devices directly. Voice Monkey works around that:
each Voice Monkey "Routine Trigger" shows up in Alexa as a device, and an Alexa routine runs
whenever the cloud helper presses it.

Voice Monkey's free plan allows **3 Routine Triggers and 200 uses a month**, so the dashboard
uses exactly three:

| Trigger | Alexa routine does | Used by |
|---|---|---|
| Dashboard TV On | Turns the Fire TV on | Fire TV tile |
| Dashboard TV Off | Turns the Fire TV off | Fire TV tile; Leaving, Bed, Vacation, All off |
| Dashboard PS5 | Turns the Fire TV on, then switches to HDMI 2 | PS5 tile; Gaming |

## 1. Turn on Voice Monkey

1. In the Alexa app, go to **More → Skills & Games**, search **Voice Monkey**, and tap
   **Enable to Use**. Sign in with your Amazon account when asked.
2. On the Mac, go to https://app.voicemonkey.io and sign in with the same Amazon account.

## 2. Create the three triggers

1. In the Voice Monkey console, open **Routine Triggers** (app.voicemonkey.io/routines).
2. Create three, named exactly: `Dashboard TV On`, `Dashboard TV Off`, `Dashboard PS5`.
3. Copy each one's **device ID** from its card and send the three IDs to Claude. They aren't
   secret; they do nothing without your token.

## 3. Create the Alexa routines

In the Alexa app, for each trigger: **More → Routines → +**.

1. **When this happens:** Smart Home → pick the Voice Monkey trigger (for example
   "Dashboard TV On") → **Pressed** / **Detects** (wording varies).
2. **Add action:**
   - TV On: **Smart Home → your Fire TV → Power On**. If there's no power option, use
     **Customized** and type `turn on the TV`.
   - TV Off: **Smart Home → your Fire TV → Power Off**, or **Customized** with `turn off the TV`.
   - PS5: first the same "turn on" action, then add a **Wait** of about 5 seconds, then
     **Customized** with `switch to HDMI 2`.
3. **Alexa will respond from:** your Echo Dot.
4. Save, then press the trigger in the Voice Monkey console to test the routine.

Tip: before building the PS5 routine, say "Alexa, switch to HDMI 2" to your Echo while the TV is
on. If that phrase doesn't work, try "Alexa, switch the Fire TV to HDMI 2" or the name your TV
shows for that input, and use whichever works in the routine.

## 4. Give the cloud helper your token

1. In the Voice Monkey console, open **API Tokens** (app.voicemonkey.io/tokens) and create one.
2. In Terminal:

```bash
cd ~/Downloads/Projects/ipad-home-dashboard/worker && nvm use && npx wrangler secret put VOICE_MONKEY_TOKEN
```

Paste the token when asked.

## Notes

- Each tap of the Fire TV or PS5 tile, and each scene that includes the TV, uses one of the
  200 monthly triggers.
- Alexa can't report whether the TV is on, so the Fire TV tile shows "last set": what the
  dashboard last asked for. Using the remote won't update it.
- Voice Monkey's Hobby plan ($6.99/month) raises the limit to 25 triggers, which would bring back
  app buttons like Netflix and YouTube. Add them to `tv.apps` in `site/home-config.js`.
