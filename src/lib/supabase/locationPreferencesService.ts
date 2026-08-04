import {
  DEFAULT_LOCATION_PREFS,
  DEFAULT_SEARCH_RADIUS_MILES,
  RADIUS_OPTIONS_MILES,
  snapToRadiusOptionMiles,
  type LocationPreferences,
  type RadiusOptionMiles,
} from '../locationPreferences'
import { isSupabaseConfigured } from './config'
import { getSupabaseClient } from './client'
import { resolveSupabaseProfileId } from './profileIds'
import type { User } from '../../types'

function normalizeRadiusMiles(value: number | null | undefined): RadiusOptionMiles {
  if (value == null) return DEFAULT_SEARCH_RADIUS_MILES
  const snapped = snapToRadiusOptionMiles(value)
  return RADIUS_OPTIONS_MILES.includes(snapped) ? snapped : DEFAULT_SEARCH_RADIUS_MILES
}

function mergeRemoteRow(
  row: {
    search_radius_miles: number | null
    search_location_lat: number | null
    search_location_lng: number | null
    search_location_label: string | null
  },
  fallback: LocationPreferences,
): LocationPreferences {
  const hasCoords = row.search_location_lat != null && row.search_location_lng != null

  return {
    userLocation: hasCoords
      ? {
          latitude: row.search_location_lat!,
          longitude: row.search_location_lng!,
        }
      : fallback.userLocation,
    userLocationLabel: row.search_location_label?.trim() || fallback.userLocationLabel,
    searchRadiusMiles: normalizeRadiusMiles(row.search_radius_miles ?? fallback.searchRadiusMiles),
  }
}

export async function fetchLocationPreferencesFromSupabase(
  user: Pick<User, 'id' | 'phone' | 'email'>,
  fallback: LocationPreferences = DEFAULT_LOCATION_PREFS,
): Promise<LocationPreferences | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = getSupabaseClient()
  if (!supabase) return null

  const profileId = await resolveSupabaseProfileId(user)
  if (!profileId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('search_radius_miles, search_location_lat, search_location_lng, search_location_label')
    .eq('id', profileId)
    .maybeSingle()

  if (error || !data) return null
  return mergeRemoteRow(data, fallback)
}

export async function saveLocationPreferencesToSupabase(
  user: Pick<User, 'id' | 'phone' | 'email'>,
  prefs: LocationPreferences,
): Promise<void> {
  if (!isSupabaseConfigured()) return

  const supabase = getSupabaseClient()
  if (!supabase) return

  const profileId = await resolveSupabaseProfileId(user)
  if (!profileId) return

  const { error } = await supabase
    .from('profiles')
    .update({
      search_radius_miles: prefs.searchRadiusMiles,
      search_location_lat: prefs.userLocation.latitude,
      search_location_lng: prefs.userLocation.longitude,
      search_location_label: prefs.userLocationLabel,
    })
    .eq('id', profileId)

  if (error && __DEV__) {
    console.warn('[location] Supabase prefs save failed', error.message)
  }
}

/** Load remote guest search prefs when signed in; backfill Supabase when missing. */
export async function syncLocationPreferencesForUser(
  user: Pick<User, 'id' | 'phone' | 'email'>,
  local: LocationPreferences,
): Promise<LocationPreferences> {
  const remote = await fetchLocationPreferencesFromSupabase(user, local)
  if (!remote) {
    await saveLocationPreferencesToSupabase(user, local)
    return local
  }

  await saveLocationPreferencesToSupabase(user, remote)
  return remote
}
