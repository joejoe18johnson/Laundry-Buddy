import type { ConfigContext, ExpoConfig } from 'expo/config'

const LOCATION_PERMISSION =
  'Allow Laundry Buddy to use your location to find nearby dryers across Belize.'
const BIOMETRIC_PERMISSION =
  'Allow Laundry Buddy to use Face ID or fingerprint so you can sign in quickly.'
const CAMERA_PERMISSION =
  'Allow Laundry Buddy to use your camera for load photos and verification selfies.'
const PHOTOS_PERMISSION =
  'Allow Laundry Buddy to access your photos so you can share a picture of your load with the host.'

const EAS_PROJECT_ID = '2bd26f4b-fcfc-43c4-8dd2-da21eef995e6'

function getSupabaseHost(): string | undefined {
  const raw = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()
  if (!raw) return undefined
  try {
    return new URL(raw).hostname
  } catch {
    return undefined
  }
}

const supabaseHost = getSupabaseHost()

const androidIntentFilters: NonNullable<ExpoConfig['android']>['intentFilters'] = [
  {
    action: 'VIEW',
    autoVerify: false,
    data: [
      {
        scheme: 'laundrybuddy',
        host: 'auth',
        pathPrefix: '/callback',
      },
    ],
    category: ['BROWSABLE', 'DEFAULT'],
  },
  {
    action: 'VIEW',
    autoVerify: false,
    data: [
      {
        scheme: 'laundrybuddy',
        host: 'host',
        pathPrefix: '/',
      },
    ],
    category: ['BROWSABLE', 'DEFAULT'],
  },
]

if (supabaseHost) {
  androidIntentFilters.push({
    action: 'VIEW',
    autoVerify: false,
    data: [
      {
        scheme: 'https',
        host: supabaseHost,
        pathPrefix: '/functions/v1/host-profile',
      },
    ],
    category: ['BROWSABLE', 'DEFAULT'],
  })
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Laundry Buddy',
  slug: 'laundry-buddy',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/AppIcons/appstore.png',
  scheme: 'laundrybuddy',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/logo-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.laundrybuddy.app',
    buildNumber: '1',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: LOCATION_PERMISSION,
      NSFaceIDUsageDescription: BIOMETRIC_PERMISSION,
      NSCameraUsageDescription: CAMERA_PERMISSION,
      NSPhotoLibraryUsageDescription: PHOTOS_PERMISSION,
      NSPhotoLibraryAddUsageDescription: PHOTOS_PERMISSION,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    softwareKeyboardLayoutMode: 'resize',
    adaptiveIcon: {
      foregroundImage: './assets/AppIcons/android/adaptive-foreground.png',
      backgroundColor: '#0f1118',
      monochromeImage: './assets/AppIcons/android/adaptive-foreground.png',
    },
    package: 'com.laundrybuddy.app',
    versionCode: 4,
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'USE_BIOMETRIC',
      'USE_FINGERPRINT',
      'CAMERA',
      'READ_MEDIA_IMAGES',
      'POST_NOTIFICATIONS',
      'VIBRATE',
    ],
    blockedPermissions: ['RECORD_AUDIO'],
    intentFilters: androidIntentFilters,
  },
  web: {
    favicon: './assets/AppIcons/playstore.png',
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        backgroundColor: '#ffffff',
        image: './assets/logo-icon.png',
        imageWidth: 280,
        resizeMode: 'contain',
        android: {
          image: './assets/logo-icon.png',
          // Android masks the splash icon to a 192dp circle on a 288dp canvas.
          // Keep the wide wordmark under that diameter so the bunny + text aren't clipped.
          imageWidth: 168,
          backgroundColor: '#ffffff',
          resizeMode: 'contain',
        },
      },
    ],
    'expo-font',
    'expo-asset',
    'expo-local-authentication',
    [
      'expo-image-picker',
      {
        photosPermission: PHOTOS_PERMISSION,
        cameraPermission: CAMERA_PERMISSION,
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: CAMERA_PERMISSION,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: LOCATION_PERMISSION,
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/AppIcons/status-icon.png',
        color: '#000000',
        sounds: [],
        mode: 'production',
      },
    ],
    '@maplibre/maplibre-react-native',
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '15.1',
        },
        android: {
          minSdkVersion: 24,
          compileSdkVersion: 36,
          targetSdkVersion: 36,
        },
      },
    ],
    'expo-updates',
  ],
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    // Local preview APKs should use the embedded bundle, not an older OTA update.
    enabled: process.env.EXPO_PUBLIC_DISABLE_OTA_UPDATES !== 'true',
  },
  runtimeVersion: '1.0.0',
  newArchEnabled: false,
  extra: {
    ...config?.extra,
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
  owner: 'joejoe18johnson',
})
