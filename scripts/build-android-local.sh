#!/usr/bin/env bash
# Build a release APK and/or AAB locally for sideloading / Play Store upload.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BUILD_TARGET="${1:-apk}"

if [[ "$BUILD_TARGET" != "apk" && "$BUILD_TARGET" != "aab" && "$BUILD_TARGET" != "both" ]]; then
  echo "Usage: $0 [apk|aab|both]" >&2
  exit 1
fi

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
if [[ ! -d "$ANDROID_HOME" ]]; then
  echo "Android SDK not found. Set ANDROID_HOME or install Android Studio." >&2
  exit 1
fi

export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

# Keep the JS bundle baked into the APK; don't replace it with an older EAS update at launch.
export EXPO_PUBLIC_DISABLE_OTA_UPDATES=true

echo "→ Syncing android/ from app.config.ts (expo prebuild)..."
npx expo prebuild --platform android --no-install

GRADLE_PROPS="$ROOT/android/gradle.properties"
if [[ -f "$GRADLE_PROPS" ]]; then
  if grep -q '^org.gradle.jvmargs=' "$GRADLE_PROPS"; then
    sed -i '' 's/^org.gradle.jvmargs=.*/org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError/' "$GRADLE_PROPS"
  fi
  if ! grep -q '^kotlin.daemon.jvmargs=' "$GRADLE_PROPS"; then
    echo 'kotlin.daemon.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m' >> "$GRADLE_PROPS"
  fi
fi

echo "→ Building release ($BUILD_TARGET)..."
cd android
chmod +x gradlew

# Force Metro to rebundle JS/assets so logo and UI changes are always in the APK.
rm -rf app/build/generated/assets/createBundleReleaseJsAndAssets

GRADLE_ARGS=(-PreactNativeArchitectures=arm64-v8a,armeabi-v7a)
# Skip lint on local preview builds — saves memory and time for host testing APKs.
LINT_SKIP=(-x lintVitalAnalyzeRelease -x lintVitalReportRelease -x lintVitalRelease)

mkdir -p "$ROOT/dist"

if [[ "$BUILD_TARGET" == "apk" || "$BUILD_TARGET" == "both" ]]; then
  ./gradlew :app:assembleRelease "${GRADLE_ARGS[@]}" "${LINT_SKIP[@]}"
  APK_SRC="app/build/outputs/apk/release/app-release.apk"
  APK_OUT="$ROOT/dist/laundry-buddy-preview.apk"
  cp "$APK_SRC" "$APK_OUT"
  echo ""
  echo "✓ APK ready for host testing:"
  echo "  $APK_OUT"
  echo "  Share via WhatsApp, Drive, or adb install $APK_OUT"
fi

if [[ "$BUILD_TARGET" == "aab" || "$BUILD_TARGET" == "both" ]]; then
  ./gradlew :app:bundleRelease "${GRADLE_ARGS[@]}" "${LINT_SKIP[@]}"
  AAB_SRC="app/build/outputs/bundle/release/app-release.aab"
  AAB_OUT="$ROOT/dist/laundry-buddy-release.aab"
  cp "$AAB_SRC" "$AAB_OUT"
  echo ""
  echo "✓ AAB ready for Google Play upload:"
  echo "  $AAB_OUT"
fi

echo ""
echo "Note: release builds are signed with the debug keystore (fine for internal host testing)."
echo "For Play Store production, configure a release keystore in android/app/build.gradle."
