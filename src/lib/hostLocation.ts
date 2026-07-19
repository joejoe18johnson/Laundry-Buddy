import * as Location from 'expo-location'
import { BELIZE_VILLAGES } from '../data/belizeVillages'
import { distanceKm, type Coordinates } from './geo'

export type ResolvedHostLocation = {
  location: string
  district: string
  address?: string
  latitude: number
  longitude: number
}

function nearestVillage(coords: Coordinates) {
  let best = BELIZE_VILLAGES[0]
  let bestDistance = Number.POSITIVE_INFINITY

  for (const village of BELIZE_VILLAGES) {
    const nextDistance = distanceKm(coords, village)
    if (nextDistance < bestDistance) {
      bestDistance = nextDistance
      best = village
    }
  }

  return best
}

function buildStreetAddress(parts: {
  streetNumber?: string | null
  street?: string | null
  name?: string | null
}): string {
  return [parts.streetNumber, parts.street, parts.name].filter(Boolean).join(' ').trim()
}

export async function resolveHostLocationFromGps(): Promise<ResolvedHostLocation | null> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') return null

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  })
  const coords: Coordinates = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  }

  const nearest = nearestVillage(coords)

  try {
    const results = await Location.reverseGeocodeAsync(coords)
    const place = results[0]
    if (place) {
      const street = buildStreetAddress(place)
      const area =
        place.city?.trim() ||
        place.subregion?.trim() ||
        place.district?.trim() ||
        nearest.name
      const district =
        place.region?.trim() ||
        place.subregion?.trim() ||
        nearest.district

      return {
        location: area,
        district,
        address: street || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }
    }
  } catch {
    // Fall back to nearest Belize village when reverse geocoding is unavailable.
  }

  return {
    location: nearest.name,
    district: nearest.district,
    latitude: coords.latitude,
    longitude: coords.longitude,
  }
}
