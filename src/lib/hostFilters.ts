import type { Host } from '../types'
import { BELIZE_FILTER_AREAS, FILTER_AREA_DISTRICT, hostMatchesFilterArea } from './belizeDistricts'
import { formatTurnaroundHoursLabel } from './turnaroundTime'

export type HostSort = 'nearest' | 'cheapest' | 'rating' | 'fastest'

export type TopRatedFilter = 'my-area' | 'each-area'

export interface HostFilters {
  location: string | null
  maxPrice: number | null
  minRating: number | null
  maxDryHours: number | null
  topRated: TopRatedFilter | null
}

export type SearchSuggestion =
  | { type: 'host'; host: Host; label: string }
  | { type: 'place'; label: string; district?: string }

export const DEFAULT_HOST_FILTERS: HostFilters = {
  location: null,
  maxPrice: null,
  minRating: null,
  maxDryHours: null,
  topRated: null,
}

export function formatHostPrice(price: number): string {
  return price <= 0 ? 'Free' : `$${price}`
}

export function hostPriceLabel(price: number): string {
  void price
  return 'Per Load'
}

export function formatHostFooterMeta(slotsLeft: number, turnaroundHours: number): string {
  return `Per Load · ${slotsLeft} Slot${slotsLeft === 1 ? '' : 's'} · ${formatTurnaroundHoursLabel(turnaroundHours)}`
}

export function countActiveFilters(filters: HostFilters): number {
  return [
    filters.location,
    filters.maxPrice,
    filters.minRating,
    filters.maxDryHours,
    filters.topRated,
  ].filter((v) => v != null).length
}

function hostSearchHaystack(host: Host): string {
  return [
    host.name,
    host.location,
    host.district,
    host.address,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function getSearchRelevance(host: Host, query: string): number {
  const q = query.trim().toLowerCase()
  if (!q) return 0

  const name = host.name.toLowerCase()
  const location = host.location.toLowerCase()
  const district = (host.district ?? '').toLowerCase()
  const address = host.address.toLowerCase()

  if (name === q) return 120
  if (name.startsWith(q)) return 100
  if (location === q || district === q) return 95
  if (location.startsWith(q) || district.startsWith(q)) return 85
  if (name.includes(q)) return 75
  if (location.includes(q)) return 65
  if (district.includes(q)) return 60
  if (address.includes(q)) return 50

  const tokens = q.split(/\s+/).filter(Boolean)
  const haystack = hostSearchHaystack(host)
  const matchedTokens = tokens.filter((token) => haystack.includes(token)).length
  return matchedTokens * 20
}

export function matchesHostSearch(host: Host, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const filterArea = BELIZE_FILTER_AREAS.find((area) => area.toLowerCase() === q)
  if (filterArea && hostMatchesFilterArea(host, filterArea)) return true

  const haystack = hostSearchHaystack(host)
  const tokens = q.split(/\s+/).filter(Boolean)
  return tokens.every((token) => haystack.includes(token))
}

function compareByRating(a: Host, b: Host): number {
  const byRating = b.rating - a.rating
  if (byRating !== 0) return byRating
  const byReviews = (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
  if (byReviews !== 0) return byReviews
  return (a.distanceKm ?? 999) - (b.distanceKm ?? 999)
}

/** Best-rated host per curated filter area (Belmopan, Dangriga, etc.). */
export function pickTopRatedHostPerArea(hosts: Host[]): Host[] {
  const picks: Host[] = []
  for (const area of BELIZE_FILTER_AREAS) {
    const candidates = hosts.filter(
      (host) => host.rating > 0 && hostMatchesFilterArea(host, area),
    )
    if (!candidates.length) continue
    picks.push([...candidates].sort(compareByRating)[0])
  }
  return picks.sort(compareByRating)
}

function compareHosts(a: Host, b: Host, sort: HostSort): number {
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
    if (filters.location && !hostMatchesFilterArea(host, filters.location)) return false
    if (filters.maxPrice != null && host.price > filters.maxPrice) return false
    if (filters.minRating != null) {
      if (host.rating <= 0) return false
      if (host.rating < filters.minRating) return false
    }
    if (filters.maxDryHours != null && host.turnaroundHours > filters.maxDryHours) return false
    return true
  })

  if (filters.topRated === 'my-area') {
    return result.filter((host) => host.rating > 0).sort(compareByRating)
  }

  if (filters.topRated === 'each-area') {
    return pickTopRatedHostPerArea(result)
  }

  result = [...result].sort((a, b) => {
    const bySort = compareHosts(a, b, sort)
    if (bySort !== 0) return bySort
    if (query) {
      return getSearchRelevance(b, query) - getSearchRelevance(a, query)
    }
    return 0
  })

  return result
}

export function getSearchSuggestions(hosts: Host[], query: string, limit = 8): string[] {
  return getSearchSuggestionItems(hosts, query, limit).map((item) => item.label)
}

export function getSearchSuggestionItems(hosts: Host[], query: string, limit = 8): SearchSuggestion[] {
  const q = query.trim().toLowerCase()
  const items: SearchSuggestion[] = []
  const seen = new Set<string>()

  const addPlace = (label: string, district?: string) => {
    const key = label.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    items.push({ type: 'place', label, district })
  }

  const addHost = (host: Host) => {
    const key = `host:${host.id}`
    if (seen.has(key)) return
    seen.add(key)
    items.push({ type: 'host', host, label: host.name })
  }

  if (!q) {
    BELIZE_FILTER_AREAS.forEach((area) => addPlace(area, FILTER_AREA_DISTRICT[area]))
    hosts.slice(0, Math.max(0, limit - items.length)).forEach(addHost)
    return items.slice(0, limit)
  }

  const rankedHosts = [...hosts]
    .filter((host) => matchesHostSearch(host, q))
    .sort((a, b) => getSearchRelevance(b, q) - getSearchRelevance(a, q))

  for (const host of rankedHosts) {
    if (items.length >= limit) break
    if (host.name.toLowerCase().includes(q)) addHost(host)
  }

  for (const host of hosts) {
    if (items.length >= limit) break
    if (host.district?.toLowerCase().includes(q)) addPlace(host.district, host.district)
    if (host.location.toLowerCase().includes(q)) addPlace(host.location, host.district)
  }

  for (const host of rankedHosts) {
    if (items.length >= limit) break
    addHost(host)
  }

  return items.slice(0, limit)
}

export function getFilterAreas(): string[] {
  return [...BELIZE_FILTER_AREAS]
}

/** @deprecated Use getFilterAreas() */
export function getHostLocations(_hosts: Host[]): string[] {
  return getFilterAreas()
}
