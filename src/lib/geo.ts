import type { Host } from '../types'

export interface Coordinates {
  latitude: number
  longitude: number
}

export const SEARCH_RADIUS_KM = 5

const EARTH_RADIUS_KM = 6371

/** Haversine distance in kilometres between two coordinates. */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export function enrichHostsWithDistance(hosts: Host[], origin: Coordinates): Host[] {
  return hosts.map((host) => ({
    ...host,
    distanceKm: Math.round(distanceKm(origin, host) * 10) / 10,
  }))
}

export function filterHostsWithinRadius(
  hosts: Host[],
  origin: Coordinates,
  radiusKm: number = SEARCH_RADIUS_KM,
): Host[] {
  return hosts.filter((host) => distanceKm(origin, host) <= radiusKm)
}

/** Ring of [lng, lat] pairs approximating a circle. */
export function circleRing(
  center: Coordinates,
  radiusKm: number,
  points = 64,
): [number, number][] {
  const coords: [number, number][] = []
  const latRad = (center.latitude * Math.PI) / 180
  const lngScale = Math.cos(latRad)

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const lat = center.latitude + (radiusKm / 111.32) * Math.cos(angle)
    const lng = center.longitude + (radiusKm / (111.32 * lngScale)) * Math.sin(angle)
    coords.push([lng, lat])
  }

  return coords
}
