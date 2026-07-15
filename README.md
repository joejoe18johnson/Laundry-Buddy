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

### Sync native projects after config changes

If you change plugins or permissions in `app.config.ts`, regenerate native folders locally:

```bash
npm run prebuild:clean
```

EAS cloud builds use the committed `ios/` and `android/` projects; run prebuild before pushing when native config changes.

## Training accounts

All passwords: `demo1234`

| Account | Login |
|---------|-------|
| Ana (guest) | `6001111` |
| Carlos (active load) | `carlos@gmail.com` |
| Maria (host) | `maria@example.com` |
| Mr. Lopez (host) | `lopez@example.com` |
| Sandra (pending verify) | `6003456` |

See the welcome screen in-app for the full list.
