import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ThemePreference } from '../theme'

const PREFS_KEY = 'laundry-buddy-theme-preference'

export async function loadThemePreference(): Promise<ThemePreference | null> {
  const raw = await AsyncStorage.getItem(PREFS_KEY)
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  return null
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, preference)
}
