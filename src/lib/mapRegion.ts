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

/** Map lat/lng to 0–1 positions inside the visible region. */
export function projectCoordinate(
  latitude: number,
  longitude: number,
  region: MapRegion,
): { x: number; y: number } {
  const west = region.longitude - region.longitudeDelta / 2
  const east = region.longitude + region.longitudeDelta / 2
  const south = region.latitude - region.latitudeDelta / 2
  const north = region.latitude + region.latitudeDelta / 2
  const x = (longitude - west) / (east - west)
  const y = 1 - (latitude - south) / (north - south)
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  }
}

/** Remote sample map (used when bundled asset unavailable). */
export function buildSampleMapUrl(region: MapRegion, width = 800, height = 800): string {
  const zoom = region.latitudeDelta > 0.2 ? 10 : region.latitudeDelta > 0.1 ? 11 : 12
  return (
    'https://staticmap.openstreetmap.de/staticmap.php' +
    `?center=${region.latitude},${region.longitude}` +
    `&zoom=${zoom}&size=${width}x${height}&maptype=mapnik`
  )
}

/** OpenFreeMap vector style — free, no API key (MapLibre). */
export const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

/** OpenStreetMap raster tiles — free, no API key required. */
export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

export function regionToBounds(region: MapRegion) {
  return {
    ne: [region.longitude + region.longitudeDelta / 2, region.latitude + region.latitudeDelta / 2] as [
      number,
      number,
    ],
    sw: [region.longitude - region.longitudeDelta / 2, region.latitude - region.latitudeDelta / 2] as [
      number,
      number,
    ],
  }
}

export function regionToZoom(latitudeDelta: number): number {
  return Math.max(8, Math.min(14, Math.round(Math.log2(360 / latitudeDelta) - 0.5)))
}
