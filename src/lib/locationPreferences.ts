import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Coordinates } from './geo'
import { USER_LOCATION } from './mapRegion'

const PREFS_KEY = 'laundry-buddy-location-prefs'

export const RADIUS_OPTIONS_KM = [1, 3, 5, 10, 15, 20, 30] as const
export type RadiusOptionKm = (typeof RADIUS_OPTIONS_KM)[number]

export interface LocationPreset {
  label: string
  latitude: number
  longitude: number
}

/** Major towns across all six Belize districts. */
export const LOCATION_PRESETS: LocationPreset[] = [
  { label: 'Belize City', latitude: 17.5046, longitude: -88.1962 },
  { label: 'Belmopan', latitude: 17.251, longitude: -88.759 },
  { label: 'San Ignacio', latitude: 17.156, longitude: -89.069 },
  { label: 'Orange Walk', latitude: 18.0812, longitude: -88.563 },
  { label: 'Corozal Town', latitude: 18.3938, longitude: -88.3885 },
  { label: 'Dangriga', latitude: 16.9697, longitude: -88.2331 },
  { label: 'Punta Gorda', latitude: 16.098, longitude: -88.8098 },
  { label: 'Roaring Creek', latitude: 17.012, longitude: -88.901 },
  { label: 'Santa Elena', latitude: 17.151, longitude: -89.064 },
]

export interface LocationPreferences {
  userLocation: Coordinates
  userLocationLabel: string
  searchRadiusKm: number
}

export function locationPreferencesEqual(a: LocationPreferences, b: LocationPreferences): boolean {
  return (
    a.userLocationLabel === b.userLocationLabel &&
    a.searchRadiusKm === b.searchRadiusKm &&
    a.userLocation.latitude === b.userLocation.latitude &&
    a.userLocation.longitude === b.userLocation.longitude
  )
}

export const DEFAULT_LOCATION_PREFS: LocationPreferences = {
  userLocation: USER_LOCATION,
  userLocationLabel: 'Belmopan',
  searchRadiusKm: 10,
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
