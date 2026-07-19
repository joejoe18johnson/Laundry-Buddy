import type { Host } from '../types'
import type { Coordinates } from './geo'
import { SEARCH_RADIUS_KM } from './geo'

export { SEARCH_RADIUS_KM }
export type { Coordinates } from './geo'

/** Default guest search center — Belmopan (central Belize). */
export const USER_LOCATION: Coordinates = {
  latitude: 17.251,
  longitude: -88.759,
}

export interface MapRegion {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

export function getMapRegion(hosts: Host[], center: Coordinates = USER_LOCATION): MapRegion {
  void hosts
  return getMapRegionForRadius(center, SEARCH_RADIUS_KM)
}

/** Map view that fits a radius circle around the guest. */
export function getMapRegionForRadius(center: Coordinates, radiusKm: number): MapRegion {
  const latitudeDelta = (radiusKm * 2.4) / 111
  const longitudeDelta = latitudeDelta / Math.cos((center.latitude * Math.PI) / 180)
  return {
    latitude: center.latitude,
    longitude: center.longitude,
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

/**
 * Brand map style: Carto Positron (light gray B&W) everywhere.
 * Do not use colorful OSM Mapnik or other saturated tile layers in the app UI.
 */
/** OpenFreeMap Positron — light gray vector style (MapLibre). */
export const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

/** Carto Positron raster tiles — same look for Leaflet / WebView fallback. */
export const POSITRON_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
export const POSITRON_TILE_ATTRIBUTION = '&copy; OpenStreetMap &copy; CARTO'

/** @deprecated Use POSITRON_TILE_URL — kept for legacy references. */
export const OSM_TILE_URL = POSITRON_TILE_URL

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

export function zoomLevelForRadiusKm(radiusKm: number): number {
  return regionToZoom(getMapRegionForRadius(USER_LOCATION, radiusKm).latitudeDelta)
}
