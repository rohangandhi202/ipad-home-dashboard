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
     └─ Voice Monkey -> Alexa routines .... Fire TV power, apps, HDMI 2 for the PS5 (no state)
```

Alexa can't report device state to outside apps, so Alexa-only devices show the last thing the
dashboard told them to do.

## Phases

| # | Phase | Who | Done when |
|---|---|---|---|
| 0 | Accounts: Cloudflare, Govee API key, Tuya developer account, Voice Monkey skill | You | Keys saved somewhere private |
| 1 | Repo and design A dashboard: aurora, clock, weather, tiles, scenes (demo mode) | Claude | Opens full-screen from the iPad Home Screen |
| 2 | Cloudflare Worker and Govee | Claude, then you add the key | Desk/TV lights toggle and show live state |
| 3 | Tuya: Smart Life lamp and the three plugs | Claude, then you link Smart Life | Same as phase 2 |
| 4 | Alexa bridge: Fire TV power, apps, HDMI 2 | Claude writes the routine checklist; you create the routines | Each button fires its routine |
| 5 | Surplife lamp Shortcuts | You build them; Claude wires the tile | The lamp responds from the dashboard |
| 6 | Scenes run in the Worker (one request per scene) | Claude | Every scene sets all its devices |
| 7 | Kiosk: Guided Access, Auto-Lock off, charger on a plug cycling 30–80%, night dimming | You | iPad stays on and protects its battery |

## Scenes

Defined in [`site/home-config.js`](../site/home-config.js); edit there.

| Scene | Does |
|---|---|
| Leaving | Everything off except the TV Stand plug |
| Bed | All lights and the TV off, Desk plug on (TV Stand and Counter plugs left as they are) |
| Movie | TV light on, desk light off, lamp on, Fire TV on and open Netflix |
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
