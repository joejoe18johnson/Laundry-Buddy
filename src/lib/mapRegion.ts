import type { Host } from '../types'

/** Guest search center — San Ignacio, Cayo */
export const USER_LOCATION = {
  latitude: 17.156,
  longitude: -89.069,
}

const DEFAULT_DELTA = {
  latitudeDelta: 0.14,
  longitudeDelta: 0.14,
}

export interface MapRegion {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

export function getMapRegion(hosts: Host[]): MapRegion {
  if (!hosts.length) {
    return { ...USER_LOCATION, ...DEFAULT_DELTA }
  }

  const lats = hosts.map((h) => h.latitude)
  const lngs = hosts.map((h) => h.longitude)
  lats.push(USER_LOCATION.latitude)
  lngs.push(USER_LOCATION.longitude)

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  const latitudeDelta = Math.max((maxLat - minLat) * 1.5, 0.06)
  const longitudeDelta = Math.max((maxLng - minLng) * 1.5, 0.06)

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  }
}

/** OpenStreetMap raster tiles — free, no API key required. */
export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
