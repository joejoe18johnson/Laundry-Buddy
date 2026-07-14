import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Coordinates } from './geo'
import { USER_LOCATION } from './mapRegion'

const PREFS_KEY = 'laundry-buddy-location-prefs'

export const RADIUS_OPTIONS_KM = [3, 5, 10, 15, 20] as const
export type RadiusOptionKm = (typeof RADIUS_OPTIONS_KM)[number]

export interface LocationPreset {
  label: string
  latitude: number
  longitude: number
}

export const LOCATION_PRESETS: LocationPreset[] = [
  { label: 'San Ignacio', latitude: 17.156, longitude: -89.069 },
  { label: 'UB / Santa Elena', latitude: 17.151, longitude: -89.064 },
  { label: 'Las Flores', latitude: 17.158, longitude: -89.072 },
  { label: 'Maya Mopan', latitude: 17.163, longitude: -89.076 },
  { label: 'Cristo Rey', latitude: 17.17, longitude: -89.082 },
  { label: 'Bullet Tree', latitude: 17.175, longitude: -89.058 },
  { label: 'Esperanza', latitude: 17.14, longitude: -89.052 },
  { label: 'Succotz', latitude: 17.148, longitude: -89.088 },
]

export interface LocationPreferences {
  userLocation: Coordinates
  userLocationLabel: string
  searchRadiusKm: number
}

export const DEFAULT_LOCATION_PREFS: LocationPreferences = {
  userLocation: USER_LOCATION,
  userLocationLabel: 'San Ignacio',
  searchRadiusKm: 5,
}

export async function loadLocationPreferences(): Promise<LocationPreferences> {
  const raw = await AsyncStorage.getItem(PREFS_KEY)
  if (!raw) return DEFAULT_LOCATION_PREFS
  try {
    const parsed = JSON.parse(raw) as LocationPreferences
    return {
      userLocation: parsed.userLocation ?? DEFAULT_LOCATION_PREFS.userLocation,
      userLocationLabel: parsed.userLocationLabel ?? DEFAULT_LOCATION_PREFS.userLocationLabel,
      searchRadiusKm: parsed.searchRadiusKm ?? DEFAULT_LOCATION_PREFS.searchRadiusKm,
    }
  } catch {
    return DEFAULT_LOCATION_PREFS
  }
}

export async function saveLocationPreferences(prefs: LocationPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}
