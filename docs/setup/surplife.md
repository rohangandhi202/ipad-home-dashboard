# Sunset lamp (Surplife) setup

The Surplife lamp only speaks Bluetooth, so the cloud helper can't reach it. Instead, the iPad
runs a Siri Shortcut that controls the lamp, then jumps back to the dashboard.

The dashboard's Sunset lamp tile runs Shortcuts named exactly **`Sunset Lamp On`** and
**`Sunset Lamp Off`**. Scenes that change the lamp (Leaving, Bed, Vacation, All on, All off)
run the matching one too.

## 1. Pair the lamp with the iPad

The iPad has to be the device that talks to the lamp over Bluetooth.

1. Install **Surplife** from the App Store on the iPad and sign in with the same account as your phone.
2. Make sure the lamp shows up and you can switch it on and off from the iPad's Surplife app.
   If it's only connected to your phone, add it on the iPad too.
3. Keep the iPad within Bluetooth range of the lamp (roughly the same room).

## 2. Find Surplife's Shortcuts actions

Surplife supports Siri Shortcuts for its scenes, but the app's labels may vary. Look for one of these:

- In Surplife, on the lamp's page or a scene, an **Add to Siri** or **Siri Shortcuts** option.
  Create one for turning the lamp on (your usual sunset setting) and one for turning it off.
- Or in the **Shortcuts** app, tap **+**, then **Add Action**, search **Surplife**, and see which
  actions it offers.

## 3. Build the two Shortcuts

In the **Shortcuts** app on the iPad:

1. Tap **+** to create a new shortcut and name it **`Sunset Lamp On`** (exact spelling and capitals).
2. Add the Surplife action that turns the lamp on.
3. Add **Open URLs** and set the URL to:
   `webapp://rohangandhi202.github.io/ipad-home-dashboard/`
   This reopens the dashboard Home Screen app instead of Safari.
4. Repeat for **`Sunset Lamp Off`** with the Surplife "off" action.
5. Run each shortcut once from the Shortcuts app to test it.

If the `webapp://` link opens Safari or does nothing, try
`webapp://https://rohangandhi202.github.io/ipad-home-dashboard/`. If neither works, remove the
Open URLs step; you'll then switch back to the dashboard yourself.

## 4. Try it from the dashboard

1. Tap the **Sunset lamp** tile. The first time, iPadOS asks whether the dashboard may open
   Shortcuts. Tap **Allow**.
2. The iPad flips to Shortcuts for a moment, the lamp changes, and the dashboard comes back.

## Notes

- The Sunset lamp tile shows "last set" because the lamp can't report its state.
- Only one Shortcut can run per tap, which is why each scene changes the lamp with a single
  Shortcut.
- This doesn't work in demo mode; the tile just changes on screen.
