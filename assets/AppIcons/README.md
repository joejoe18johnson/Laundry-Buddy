# App icon pack (source of truth)

All **launcher and store icons** live here. Expo, Android, and iOS builds read from this folder.

## Key files

| File | Use |
|------|-----|
| **`appstore.png`** | Master 1024×1024 launcher icon — **edit this**, then run `npm run sync-app-icons` |
| **`status-icon.png`** | Notification / status-bar icon — **edit this directly** for push + Android status bar |
| `playstore.png` | Google Play listing (512×512) |
| `android/adaptive-foreground.png` | Android adaptive icon foreground |
| `android/mipmap-*/ic_launcher.png` | Android launcher densities |
| `Assets.xcassets/AppIcon.appiconset/` | Xcode asset catalog |
| `AppIcon.icon/` | iOS 26 Liquid Glass icon composer folder |

## After updating the icon

```bash
npm run sync-app-icons
```

This refreshes the catalog inside `AppIcons/`, copies icons into committed `ios/` and `android/` projects, and runs automatically before `npm run prebuild`.

## In-app branding (separate from launcher icons)

- `assets/logo-icon.png` — wordmark for splash + in-app UI
- `assets/lb-mascot.png` — mascot animation

Splash drawables only:

```bash
npm run generate-assets
```

## Expo wiring (`app.config.ts`)

- `icon` → `./assets/AppIcons/appstore.png`
- `android.adaptiveIcon.foregroundImage` → `./assets/AppIcons/android/adaptive-foreground.png`
- `plugins.expo-notifications.icon` → `./assets/AppIcons/status-icon.png`
- `web.favicon` → `./assets/AppIcons/playstore.png`
