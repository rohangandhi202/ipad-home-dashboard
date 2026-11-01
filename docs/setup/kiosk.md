# Kiosk setup (always-on iPad)

Keeps the iPad on the dashboard all day, and keeps its battery between about 30% and 80% so
charging around the clock doesn't wear it out.

## 1. The charger plug (Govee)

The dashboard already knows about a hidden Govee plug called **iPad Charger**. It isn't shown on
the dashboard and no scene touches it.

1. Plug the Govee smart plug into the wall and add it in the **Govee Home** app.
2. Name it exactly **`iPad Charger`** in the Govee app.
3. Plug the iPad's charger into the smart plug.

The cloud helper finds it by that name through your existing Govee key, so nothing else needs
setting up on the Mac.

## 2. Two Shortcuts that switch the charger

On the iPad, in **Shortcuts**, create two shortcuts. Each has one action, **Get Contents of URL**:

| Setting | Charger Off | Charger On |
|---|---|---|
| URL | `https://home-dashboard.bitter-disk-e675.workers.dev/devices/ipad-charger` | same |
| Method | POST | POST |
| Headers | `Authorization` = `Bearer ` + your access code | same |
| Request Body | JSON, key `on`, type **Boolean**, value **False** | same, value **True** |

Notes:

- In **Headers**, the value is the word `Bearer`, a space, then the dashboard's access code.
- Tap each shortcut to test it: the plug should click off and on.
- The access code is stored only in these Shortcuts on the iPad.

## 3. Battery automations

In **Shortcuts → Automation → +**:

1. **Battery Level → Rises Above 80%**, set to **Run Immediately** (turn off "Notify When Run"),
   action **Run Shortcut → Charger Off**.
2. **Battery Level → Falls Below 30%**, **Run Immediately**, action **Run Shortcut → Charger On**.
3. Safety net: **Battery Level → Falls Below 15%**, **Run Immediately**, **Run Shortcut → Charger On**,
   in case the 30% one was missed (for example, Wi-Fi was down at that moment).

If the iPad ever runs flat anyway, plug the charger straight into the wall to bring it back.

## 4. Keep the screen on and quiet

- **Settings → Display & Brightness → Auto-Lock → Never.**
- **Settings → Focus → Do Not Disturb**, turn it on and set it to stay on, so notifications don't
  cover the dashboard.
- Open the dashboard from its Home Screen icon and leave it there.

## 5. Night dimming

The dashboard already darkens itself from 11pm to 7am (touching the screen brightens it for two
minutes). For a dimmer screen at night, add two more automations:

- **Time of Day → 11:00 PM**, **Run Immediately**, action **Set Brightness → 10%**.
- **Time of Day → 7:00 AM**, **Run Immediately**, action **Set Brightness → 60%** (to taste).

## About Guided Access

Guided Access (Settings → Accessibility) locks the iPad to one app, which is the usual kiosk
trick. It's left off here because it would stop the Sunset lamp tile from opening Surplife. If
you'd rather lock it down and give up that tile, turn Guided Access on and set its
**Display Auto-Lock** option to **Never**.

## After a restart

iPadOS updates can restart the iPad overnight. If you find it on the Lock Screen, unlock it and
tap the dashboard icon. The dashboard reloads itself at 4am every day to pick up changes, so it
doesn't need restarting otherwise.
