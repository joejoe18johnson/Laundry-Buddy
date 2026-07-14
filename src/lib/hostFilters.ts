import type { Host } from '../types'

export type HostSort = 'nearest' | 'cheapest' | 'rating' | 'fastest'

export interface HostFilters {
  location: string | null
  maxPrice: number | null
  minRating: number | null
  maxDryHours: number | null
}

export const DEFAULT_HOST_FILTERS: HostFilters = {
  location: null,
  maxPrice: null,
  minRating: null,
  maxDryHours: null,
}

export function formatHostPrice(price: number): string {
  return price <= 0 ? 'Free' : `$${price}`
}

export function hostPriceLabel(price: number): string {
  return price <= 0 ? 'per load' : 'per load'
}

export function countActiveFilters(filters: HostFilters): number {
  return [
    filters.location,
    filters.maxPrice,
    filters.minRating,
    filters.maxDryHours,
  ].filter((v) => v != null).length
}

export function filterAndSortHosts(
  hosts: Host[],
  filters: HostFilters,
  sort: HostSort,
): Host[] {
  let result = hosts.filter((host) => {
    if (filters.location && host.location !== filters.location) return false
    if (filters.maxPrice != null && host.price > filters.maxPrice) return false
    if (filters.minRating != null) {
      if (host.rating <= 0) return false
      if (host.rating < filters.minRating) return false
    }
    if (filters.maxDryHours != null && host.turnaroundHours > filters.maxDryHours) return false
    return true
  })

  result = [...result].sort((a, b) => {
    switch (sort) {
      case 'cheapest':
        return a.price - b.price
      case 'rating':
        return b.rating - a.rating
      case 'fastest':
        return a.turnaroundHours - b.turnaroundHours
      case 'nearest':
      default:
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999)
    }
  })

  return result
}

export function getHostLocations(hosts: Host[]): string[] {
  return [...new Set(hosts.map((h) => h.location))].sort()
}
