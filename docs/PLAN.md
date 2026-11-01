# Plan

A wall dashboard for an iPad Air 4 (iPadOS 26) that runs all day, with no extra hardware.

## How it fits together

```
iPad (Home Screen web app, served by GitHub Pages)
 ├─ Open-Meteo ............................ weather (free, no key)
 ├─ shortcuts://run-shortcut .............. Surplife sunset lamp (Bluetooth, via a Siri Shortcut)
 └─ Cloudflare Worker (free) .............. holds every key, reports device state
     ├─ Govee API ......................... desk light, TV light (live state)
     ├─ Tuya cloud API .................... Smart Life lamp, TV Stand / Desk / Counter plugs (live state)
     └─ Voice Monkey -> Alexa routines .... Fire TV on/off, HDMI 2 for the PS5 (no state;
                                            free plan: 3 triggers, 200 uses a month)
```

Alexa can't report device state to outside apps, so Alexa-only devices show the last thing the
dashboard told them to do.

## Phases

| # | Phase | Who | Done when | Status |
|---|---|---|---|---|
| 0 | Accounts: Cloudflare, Govee API key, Tuya developer account, Voice Monkey skill | You | Keys saved somewhere private | |
| 1 | Repo and design A dashboard: aurora, clock, weather, tiles, scenes (demo mode) | Claude | Opens full-screen from the iPad Home Screen | Done |
| 2 | Cloudflare Worker and Govee ([setup](setup/cloud-helper.md)) | Claude, then you add the key | Desk/TV lights toggle and show live state | Done |
| 3 | Tuya: Smart Life lamp and the three plugs ([setup](setup/tuya.md)) | Claude, then you link Smart Life | Same as phase 2 | Done |
| 4 | Alexa bridge: TV on, TV off, PS5 on HDMI 2 ([setup](setup/alexa.md)) | Claude writes the routine checklist; you create the routines | Each button fires its routine | |
| 5 | Surplife lamp Shortcuts | You build them; Claude wires the tile | The lamp responds from the dashboard | |
| 6 | Scenes run in the Worker (one request per scene) | Claude | Every scene sets all its devices | |
| 7 | Kiosk: Guided Access, Auto-Lock off, charger on a plug cycling 30–80%, night dimming | You | iPad stays on and protects its battery | |

## Scenes

Defined in [`site/home-config.js`](../site/home-config.js); edit there.

| Scene | Does |
|---|---|
| Leaving | Everything off except the TV Stand plug |
| Bed | All lights, the TV and the Counter plug off, Desk plug on (TV Stand plug left as it is) |
| Gaming | TV light on, lamp on, Fire TV on and switch to HDMI 2 (PS5) |
| Vacation | Everything off |
| All on | Every light and plug on |
| All off | Everything off |

Scenes that change the sunset lamp briefly open the Shortcuts app, then return to the dashboard.

## Things to know

- GitHub Pages is free only for public repos. No secrets go in this repo; the dashboard's access
  code is entered once on the iPad and stays in its browser storage.
- Tuya developer accounts start on a trial that needs renewing from time to time.
- Voice Monkey is free while in beta; if that changes, only the Alexa-bridged buttons are affected.
