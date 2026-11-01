# Sunset lamp (Surplife) setup

The Surplife lamp only speaks Bluetooth, so the cloud helper can't reach it. Instead, the iPad
runs a Siri Shortcut that controls the lamp, then jumps back to the dashboard.

For Bluetooth lamps, Surplife doesn't support scenes ("This function is not applicable for
bluetooth devices"). Its only Shortcuts action is **Quick Switch**, which flips the lamp on or
off with no setting to choose which. So on the dashboard:

- The **Sunset lamp** tile is a toggle. It shows "Tap to switch" instead of On/Off, because
  there's no way to know which way it flipped.
- Scenes leave the lamp alone. A scene that "turns everything off" could otherwise switch it on.

## 1. Pair the lamp with the iPad

The iPad has to be the device that talks to the lamp over Bluetooth.

1. Install **Surplife** from the App Store on the iPad and sign in with the same account as your phone.
2. Make sure you can switch the lamp from the iPad's Surplife app. If it's only connected to your
   phone, add it on the iPad too.
3. Keep the iPad within Bluetooth range of the lamp (roughly the same room).

## 2. Build the Shortcut

In the **Shortcuts** app on the iPad:

1. Tap **+** to create a new shortcut and name it **`Sunset Lamp`** (exact spelling and capitals).
2. Add the Surplife **Quick Switch** action.
3. Add **Open URLs** and set the URL to:
   `webapp://rohangandhi202.github.io/ipad-home-dashboard/`
   This reopens the dashboard Home Screen app instead of Safari.
4. Run it from the Shortcuts app a couple of times to check the lamp flips each time.

If the `webapp://` link opens Safari or does nothing, try
`webapp://https://rohangandhi202.github.io/ipad-home-dashboard/`. If neither works, remove the
Open URLs step; you'll then switch back to the dashboard yourself.

## 3. Try it from the dashboard

1. Tap the **Sunset lamp** tile. The first time, iPadOS asks whether the dashboard may open
   Shortcuts. Tap **Allow**.
2. The iPad flips to Shortcuts for a moment, the lamp changes, and the dashboard comes back.

## Notes

- If Surplife ever adds separate on/off actions, set `shortcuts: { on: '…', off: '…' }` for the
  sunset lamp in `site/home-config.js` and remove `scenes: false`; the tile then shows On/Off
  and scenes include it again.
- This doesn't run in demo mode.
