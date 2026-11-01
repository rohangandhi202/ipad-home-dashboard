# iPad home dashboard

A dark, minimal smart-home dashboard for an old iPad: slow aurora background, clock, weather,
scene buttons, and tiles for every light, plug, and the Fire TV / PS5.

It's a plain web page (no build step) hosted on GitHub Pages and added to the iPad's Home Screen.
Device control goes through a small Cloudflare Worker so no keys ever live in this repo.
See [docs/PLAN.md](docs/PLAN.md) for the full plan and progress.

## Layout

| Path | What |
|---|---|
| `site/index.html`, `site/styles.css`, `site/app.js` | The dashboard |
| `site/home-config.js` | Devices, TV apps, scenes, dim hours — edit this to change the dashboard |
| `site/scenes.js` | Turns a scene into per-device on/off targets |
| `worker/` | Cloudflare Worker ("cloud helper") that holds device keys and talks to Govee, Tuya and Alexa |
| `docs/setup/` | Step-by-step setup guides |
| `.github/workflows/pages.yml` | Publishes `site/` to GitHub Pages on every push to `main` |

## Run it locally

```bash
python3 -m http.server 8080 --directory site
```

Then open http://localhost:8080.

## Demo mode

Until the iPad has the cloud helper's URL and access code, the dashboard runs in demo mode: tiles
and scenes change on screen only. Set up the helper with
[docs/setup/cloud-helper.md](docs/setup/cloud-helper.md), then press and hold the clock to enter
its URL and access code.

## Put it on the iPad

1. Open the GitHub Pages URL in Safari.
2. Share → Add to Home Screen → turn on "Open as Web App" → Add.
3. Open it from the Home Screen; it runs full-screen.
