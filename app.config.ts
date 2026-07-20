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

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Laundry Buddy',
  slug: 'laundry-buddy',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'laundrybuddy',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/lb-logo.png',
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
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0f1118',
      monochromeImage: './assets/adaptive-icon.png',
    },
    package: 'com.laundrybuddy.app',
    versionCode: 3,
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
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        backgroundColor: '#ffffff',
        image: './assets/lb-logo.png',
        imageWidth: 280,
        resizeMode: 'contain',
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
        icon: './assets/notification-icon.png',
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
