# Smart Life (Tuya) setup

Your Smart Life lamp and the TV Stand, Desk and Counter plugs all run on Tuya's cloud. A free
Tuya developer project lets the cloud helper control them and read whether they're on.

Tuya's website changes its menus from time to time, so labels may differ a little from these steps.

## 1. Create a developer account

1. Go to https://platform.tuya.com and sign up. This is a separate account from your Smart Life
   app login; any email works.
2. Skip any questions about building a product. You only need the **Cloud** section.

## 2. Create a cloud project

1. Open **Cloud → Development** and click **Create Cloud Project**.
2. Fill it in:
   - **Project name:** `Home dashboard`
   - **Industry:** Smart Home
   - **Development method:** Smart Home
   - **Data center:** **Western America**. This must match where your Smart Life account lives.
     For a US account it's Western America; picking the wrong one is the most common reason
     devices don't show up.
3. On the next screen, keep the suggested API services, especially **IoT Core** and
   **Authorization Token Management**, and click **Authorize**.
4. Subscribe to IoT Core: open **Cloud → Cloud Services**, find **IoT Core**, and start the free
   **Trial Edition** ($0). Then check the project's **Service API** tab lists both IoT Core and
   Authorization Token Management; if not, use **Go to Authorize** to add them. Without this the
   dashboard shows "IoT Core service is not subscribed".

## 3. Link your Smart Life app

1. In the project, open the **Devices** tab, then **Link App Account** (it may say "Link Tuya
   App Account") → **Add App Account**. A QR code appears.
2. On your phone, open **Smart Life → Me**, tap the scan icon in the top corner, scan the code,
   and confirm.
3. Back on the website, the lamp and all three plugs should now be listed under **Devices**.
   Note the lamp's name exactly as it's shown there.

## 4. Copy the project keys

On the project's **Overview** tab, find the **Access ID / Client ID** and **Access Secret /
Client Secret**. Don't paste them into chat or the repo. You'll add them as secrets in the
next step.

## 5. Add them to the cloud helper

In Terminal:

```bash
cd ~/Downloads/Projects/ipad-home-dashboard/worker && nvm use
```

```bash
npx wrangler secret put TUYA_ACCESS_ID
```

```bash
npx wrangler secret put TUYA_ACCESS_SECRET
```

## Notes

- New projects start on a free **IoT Core** trial. Tuya asks you to renew it every so often
  (usually a few clicks under **Cloud → Cloud Services**). If the Smart Life tiles stop working
  some day, check that first.
- If the lamp or plugs are renamed in Smart Life, the dashboard may need its config updated to match.
