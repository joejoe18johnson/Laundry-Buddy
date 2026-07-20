# Laundry Buddy

React Native mobile app for community dryer sharing **countrywide in Belize** — from Belize City and Orange Walk to Cayo, Stann Creek, Corozal, and Toledo.

## Run locally (Expo Go)

```bash
npm install
npm start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with **Expo Go** on your phone.

## EAS Preview Build

Preview builds are internal, production-like installs (APK on Android, ad hoc on iOS) with native MapLibre maps, push notifications, camera, and location — features that Expo Go cannot fully exercise.

### One-time setup

1. Install dependencies: `npm install`
2. Log in to Expo: `npx eas login`
3. Link the project: `npx eas init` (writes your EAS project ID into `app.config.ts`)
4. Configure Apple/Google credentials when prompted on first build

### Build commands

```bash
# Android APK (works without Apple Developer account)
npm run build:preview

# Both platforms — iOS requires paid Apple Developer Program ($99/yr)
npm run build:preview:all

# Platform-specific
npm run build:preview:android
npm run build:preview:ios          # physical iPhone — needs Apple Developer
npm run build:preview:ios-simulator  # Mac Simulator only — free, no Apple Developer
```

Install the build from the link EAS prints when the build finishes, or open the build page on [expo.dev](https://expo.dev).

## Local Android build (APK / AAB)

Use this to produce install files on your Mac **without EAS cloud** — ideal for sharing a test APK with hosts over WhatsApp or Google Drive.

### Prerequisites

1. **Node.js** 20+ and `npm install`
2. **JDK** 17 or 21 (`java -version`)
3. **Android SDK** — install [Android Studio](https://developer.android.com/studio) once, open it, and install the SDK. Default path: `~/Library/Android/sdk`
4. Accept SDK licenses (one time):

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses
```

If `cmdline-tools/latest` is missing, install **Android SDK Command-line Tools** from Android Studio → SDK Manager.

### Build commands

```bash
# APK for host testing (recommended — sideload on any Android phone)
npm run build:android:apk:local

# AAB for Google Play Console upload
npm run build:android:aab:local

# Both
npm run build:android:local
```

Output lands in **`dist/`**:

| File | Use |
|------|-----|
| `dist/laundry-buddy-preview.apk` | Send to hosts — they enable “Install unknown apps” and open the file |
| `dist/laundry-buddy-release.aab` | Upload to Play Store internal testing |

The script runs `expo prebuild --platform android` first so native plugins (camera, maps, notifications) stay in sync with `app.config.ts`, then `./gradlew assembleRelease` or `bundleRelease`.

### Install on a test phone

```bash
adb install -r dist/laundry-buddy-preview.apk
```

Or share the APK file directly.

**Signing:** local release builds use the debug keystore (already configured in `android/app/build.gradle`). That is fine for host testing; use a production keystore before a public Play Store release.

### Sync native projects after config changes

If you change plugins or permissions in `app.config.ts`, regenerate native folders locally:

```bash
npm run prebuild:clean
```

EAS cloud builds use the committed `ios/` and `android/` projects; run prebuild before pushing when native config changes.

### App icons

Source artwork: `assets/icon-source.png` (your laundry basket PNG). The build script strips the black background into `logo-mark.png` and generates launcher/splash sizes. Regenerate with:

```bash
npm run generate-assets
```

## Admin login

Use the normal **Log in** screen with your phone number and password.

| Field | Value |
|-------|-------|
| Phone | `622 0000` (country code +501) |
| Password | `demo1234` |

If Supabase is connected, run the admin migration in `supabase/migrations/20260719000000_admin_profile_updates.sql` so this account has admin role in the database.
