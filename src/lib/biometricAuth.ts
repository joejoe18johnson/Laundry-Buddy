import AsyncStorage from '@react-native-async-storage/async-storage'
import * as LocalAuthentication from 'expo-local-authentication'
import { Platform } from 'react-native'

const BIOMETRIC_USER_KEY = 'laundry-buddy-biometric-user'
const BIOMETRIC_ENABLED_KEY = 'laundry-buddy-biometric-enabled'

export type BiometricSupport = {
  available: boolean
  enrolled: boolean
  label: string
  icon: 'smartphone' | 'user'
}

function biometricLabel(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return Platform.OS === 'ios' ? 'Face ID' : 'Face unlock'
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint'
  }
  return 'Biometrics'
}

export async function getBiometricSupport(): Promise<BiometricSupport> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  const enrolled = await LocalAuthentication.isEnrolledAsync()
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
  const label = biometricLabel(types)
  const available = hasHardware && enrolled

  return {
    available,
    enrolled,
    label,
    icon: types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      ? 'user'
      : 'smartphone',
  }
}

export async function isBiometricLoginEnabled(): Promise<boolean> {
  const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY)
  const userId = await AsyncStorage.getItem(BIOMETRIC_USER_KEY)
  return enabled === 'true' && !!userId
}

export async function getBiometricUserId(): Promise<string | null> {
  const enabled = await isBiometricLoginEnabled()
  if (!enabled) return null
  return AsyncStorage.getItem(BIOMETRIC_USER_KEY)
}

export async function enableBiometricLogin(userId: string): Promise<boolean> {
  const support = await getBiometricSupport()
  if (!support.available) return false

  const ok = await authenticateBiometric(`Enable ${support.label} for quick sign-in`)
  if (!ok) return false

  await AsyncStorage.multiSet([
    [BIOMETRIC_USER_KEY, userId],
    [BIOMETRIC_ENABLED_KEY, 'true'],
  ])
  return true
}

export async function disableBiometricLogin(): Promise<void> {
  await AsyncStorage.multiRemove([BIOMETRIC_USER_KEY, BIOMETRIC_ENABLED_KEY])
}

export async function authenticateBiometric(
  promptMessage = 'Confirm your identity',
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use passcode',
    })
    return result.success
  } catch {
    return false
  }
}
