import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ColorScheme } from '../theme'

const THEME_KEY = 'laundry-buddy-color-scheme'

export async function loadColorScheme(): Promise<ColorScheme | null> {
  const raw = await AsyncStorage.getItem(THEME_KEY)
  return raw === 'light' || raw === 'dark' ? raw : null
}

export async function saveColorScheme(scheme: ColorScheme): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, scheme)
}
