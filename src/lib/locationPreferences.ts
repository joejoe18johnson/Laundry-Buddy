import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Coordinates } from './geo'
import { KM_PER_MILE } from './geo'
import { USER_LOCATION } from './mapRegion'

const PREFS_KEY = 'laundry-buddy-location-prefs'

export const RADIUS_OPTIONS_MILES = [1, 2, 3, 5] as const
export type RadiusOptionMiles = (typeof RADIUS_OPTIONS_MILES)[number]

/** Default host search radius for all users. */
export const DEFAULT_SEARCH_RADIUS_MILES: RadiusOptionMiles = 1

const RADIUS_DEFAULT_VERSION = '1mi-v2'
const RADIUS_VERSION_KEY = 'laundry-buddy-radius-default-version'

export function formatRadiusMilesLabel(miles: number): string {
  return `${miles} mile${miles === 1 ? '' : 's'}`
}

export function snapToRadiusOptionMiles(value: number): RadiusOptionMiles {
  let best: RadiusOptionMiles = RADIUS_OPTIONS_MILES[0]
  let bestDiff = Math.abs(value - best)
  for (const miles of RADIUS_OPTIONS_MILES) {
    const diff = Math.abs(value - miles)
    if (diff < bestDiff) {
      best = miles
      bestDiff = diff
    }
  }
  return best
}

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
  searchRadiusMiles: RadiusOptionMiles
}

type StoredLocationPreferences = Partial<LocationPreferences> & {
  /** @deprecated Migrated to searchRadiusMiles */
  searchRadiusKm?: number
}

function normalizeSearchRadiusMiles(parsed: StoredLocationPreferences): RadiusOptionMiles {
  if (
    parsed.searchRadiusMiles != null &&
    RADIUS_OPTIONS_MILES.includes(parsed.searchRadiusMiles as RadiusOptionMiles)
  ) {
    return parsed.searchRadiusMiles as RadiusOptionMiles
  }

  if (parsed.searchRadiusKm != null) {
    return snapToRadiusOptionMiles(parsed.searchRadiusKm / KM_PER_MILE)
  }

  return DEFAULT_SEARCH_RADIUS_MILES
}

export function locationPreferencesEqual(a: LocationPreferences, b: LocationPreferences): boolean {
  return (
    a.userLocationLabel === b.userLocationLabel &&
    a.searchRadiusMiles === b.searchRadiusMiles &&
    a.userLocation.latitude === b.userLocation.latitude &&
    a.userLocation.longitude === b.userLocation.longitude
  )
}

export const DEFAULT_LOCATION_PREFS: LocationPreferences = {
  userLocation: USER_LOCATION,
  userLocationLabel: 'Belmopan',
  searchRadiusMiles: DEFAULT_SEARCH_RADIUS_MILES,
}

export async function loadLocationPreferences(): Promise<LocationPreferences> {
  const raw = await AsyncStorage.getItem(PREFS_KEY)
  const radiusVersion = await AsyncStorage.getItem(RADIUS_VERSION_KEY)

  if (!raw) {
    if (radiusVersion !== RADIUS_DEFAULT_VERSION) {
      await AsyncStorage.setItem(RADIUS_VERSION_KEY, RADIUS_DEFAULT_VERSION)
    }
    return DEFAULT_LOCATION_PREFS
  }

  try {
    const parsed = JSON.parse(raw) as StoredLocationPreferences
    let prefs: LocationPreferences = {
      userLocation: parsed.userLocation ?? DEFAULT_LOCATION_PREFS.userLocation,
      userLocationLabel: parsed.userLocationLabel ?? DEFAULT_LOCATION_PREFS.userLocationLabel,
      searchRadiusMiles: normalizeSearchRadiusMiles(parsed),
    }

    if (radiusVersion !== RADIUS_DEFAULT_VERSION) {
      prefs = { ...prefs, searchRadiusMiles: DEFAULT_SEARCH_RADIUS_MILES }
      await saveLocationPreferences(prefs)
      await AsyncStorage.setItem(RADIUS_VERSION_KEY, RADIUS_DEFAULT_VERSION)
    }

    return prefs
  } catch {
    return DEFAULT_LOCATION_PREFS
  }
}

export async function saveLocationPreferences(prefs: LocationPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}
