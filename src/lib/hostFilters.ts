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
  searchQuery = '',
): Host[] {
  const query = searchQuery.trim()

  let result = hosts.filter((host) => {
    if (!matchesHostSearch(host, query)) return false
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
    let cmp = 0
    switch (sort) {
      case 'cheapest':
        cmp = a.price - b.price
        break
      case 'rating':
        cmp = b.rating - a.rating
        break
      case 'fastest':
        cmp = a.turnaroundHours - b.turnaroundHours
        break
      case 'nearest':
      default:
        cmp = (a.distanceKm ?? 999) - (b.distanceKm ?? 999)
        break
    }
    if (cmp !== 0) return cmp
    return (a.distanceKm ?? 999) - (b.distanceKm ?? 999)
  })

  return result
}

export function matchesHostSearch(host: Host, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = [
    host.name,
    host.location,
    host.district,
    host.address,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const tokens = q.split(/\s+/).filter(Boolean)
  return tokens.every((token) => haystack.includes(token))
}

export function getSearchSuggestions(hosts: Host[], query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase()
  const labels = new Set<string>()

  for (const host of hosts) {
    if (host.district) labels.add(host.district)
    labels.add(host.location)
    labels.add(host.name)
  }

  const sorted = [...labels].sort((a, b) => a.localeCompare(b))

  if (!q) {
    const districts = [...new Set(hosts.map((h) => h.district).filter(Boolean))] as string[]
    const locations = getHostLocations(hosts)
    return [...districts, ...locations.filter((l) => !districts.includes(l))].slice(0, limit)
  }

  return sorted.filter((label) => label.toLowerCase().includes(q)).slice(0, limit)
}

export function getHostLocations(hosts: Host[]): string[] {
  return [...new Set(hosts.map((h) => h.location))].sort()
}
