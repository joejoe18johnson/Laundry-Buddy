/** Minimum splash visibility when running the full onboarding test flow. */
export const TESTING_SPLASH_MS = 2000

/**
 * When true, each cold start shows splash → intro → welcome.
 * Enabled in Expo Go / dev, preview APK builds, or when explicitly set.
 * Set EXPO_PUBLIC_START_AT_INTRO=false to disable in dev.
 */
export function isFullFlowTesting(): boolean {
  if (process.env.EXPO_PUBLIC_START_AT_INTRO === 'false') return false
  return (
    process.env.EXPO_PUBLIC_START_AT_INTRO === 'true' ||
    process.env.EXPO_PUBLIC_APP_VARIANT === 'preview' ||
    __DEV__
  )
}
