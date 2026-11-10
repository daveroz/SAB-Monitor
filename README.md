# SAB Bogotá (IDIGER) — Android app

Standalone Android build of the SAB web app (React + Leaflet) using Capacitor.
No server is needed: sensor data comes from `app.sab.gov.co` and radar frames from
`evp.sire.gov.co`, both via native HTTP (no CORS). If the sensor API is down the
app falls back to the bundled station data, as before.

## Build the APK

**GitHub Actions (no local setup):** every push to `main` builds the app and puts the APK at
**https://github.com/daveroz/SAB-Monitor/releases/download/latest/SAB_Monitor.apk**, which always
has the newest build. Each run's **Actions** page also has `SAB_Monitor.apk` to download directly,
not inside a zip. You can start a build by hand from Actions → "Build APK" → Run workflow.

Every build is signed with the same key, so each new APK installs over the last one and keeps
the app's data. The key lives in the repository secret **`SIGNING_KEYSTORE_BASE64`** (Settings →
Secrets and variables → Actions): the keystore file, base64-encoded, with password `android` and
alias `androiddebugkey`. Without the secret, builds are signed with a throwaway key and aren't
published. If the phone says **"package conflicts with an existing package"**, the copy on it was
signed with another key (an older build): uninstall it once and install the new APK.

**Locally** (Node 22, JDK 21, Android SDK):

    npm install
    npm run android:apk
    # → android/app/build/outputs/apk/debug/app-debug.apk

Install on a phone: allow "install unknown apps", then open the APK.

## Changes from the web/AI Studio version
- Removed `server.ts` (Express proxy). Radar list/frames and SAB calls are now direct.
- Live radar is the latest frame from the IDIGER list; falls back to a bundled image.
- Removed the unused AI-diagnosis, PWA-install and old MapView components
  (the diagnosis needed a server-side Gemini key; never ship that key in an APK).
- Leaflet CSS is bundled instead of loaded from unpkg.
