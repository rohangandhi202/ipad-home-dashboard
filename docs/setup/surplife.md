# Sunset lamp (Surplife) setup

The Surplife lamp only speaks Bluetooth, so the cloud helper can't reach it, and Surplife's only
Shortcuts action (**Quick Switch**) does nothing for this lamp. Surplife scenes aren't available
for Bluetooth lamps either.

So the **Sunset lamp** tile is a launcher: it runs a Shortcut that opens Surplife for a few
seconds so you can tap the lamp on or off there, then brings the dashboard back.

- The tile shows "Opens Surplife" instead of On/Off.
- Scenes leave the lamp alone.

## 1. Pair the lamp with the iPad

1. Install **Surplife** on the iPad and sign in with the same account as your phone.
2. Make sure you can switch the lamp from the iPad's Surplife app.
3. Keep the iPad within Bluetooth range of the lamp.

## 2. Build the Shortcut

In the **Shortcuts** app on the iPad, create one shortcut named exactly **`Sunset Lamp`**:

1. **Open App** → Surplife
2. **Wait** → 5 seconds (enough time to tap the lamp in Surplife; adjust to taste)
3. **Open URLs** → `webapp://rohangandhi202.github.io/ipad-home-dashboard/`

Quick Switch can be left out; it doesn't affect this lamp.

## 3. Try it from the dashboard

Tap the **Sunset lamp** tile. The first time, iPadOS asks whether the dashboard may open
Shortcuts; tap **Allow**. Surplife opens, you tap the lamp, and the dashboard comes back.

## A one-tap alternative

Many simple lamps turn back on by themselves when power returns. If yours does (unplug it while
on, plug it back in, and see), plugging it into a smart plug would give the dashboard a real
On/Off tile that works in scenes too.
