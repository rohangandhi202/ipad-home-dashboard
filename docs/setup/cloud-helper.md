# Cloud helper setup (Cloudflare Worker)

The helper lives in [`worker/`](../../worker). It keeps your device keys on Cloudflare, so the
public dashboard only needs an access code that's saved on the iPad.

Run these in Terminal on the Mac. Each command goes in the `worker` folder.

## 1. Use Node 22

```bash
cd ~/Downloads/Projects/ipad-home-dashboard/worker
```

```bash
nvm use
```

```bash
npm install
```

## 2. Sign in to Cloudflare

```bash
npx wrangler login
```

A browser window opens; click **Allow**.

## 3. Deploy

```bash
npx wrangler deploy
```

It prints the helper's URL, like `https://home-dashboard.<your-subdomain>.workers.dev`.
The first time, Cloudflare may ask you to pick a `workers.dev` subdomain.

## 4. Add the secrets

Each command asks you to paste a value. It's sent straight to Cloudflare and never saved in the repo.

Govee API key (from the email Govee sent):

```bash
npx wrangler secret put GOVEE_API_KEY
```

Make an access code for the dashboard, then save it as a secret. Keep the code handy; you'll
type it into the iPad once.

```bash
openssl rand -base64 12
```

```bash
npx wrangler secret put DASHBOARD_TOKEN
```

## 5. Connect the iPad

1. Open the dashboard and press and hold the clock.
2. Enter the helper URL from step 3 and the access code from step 4, then tap **Save**.
3. The "Demo mode" label disappears. Tap the desk or TV light to test.

If a Govee tile shows "No Govee device named …", the message lists the names in your Govee
app. Either rename the device in the Govee app, or add `goveeName: 'Name in Govee'` to that
device in [`site/home-config.js`](../../site/home-config.js).

## Notes

- Govee allows 10,000 API calls a day. The dashboard checks state every 30 seconds and the
  helper caches it, which stays well under that.
- Generating a new Govee API key disables the old one. If you ever do, run
  `npx wrangler secret put GOVEE_API_KEY` again with the new key.
- Devices that aren't wired up yet (Smart Life, Alexa) show "isn't connected yet" when tapped.
