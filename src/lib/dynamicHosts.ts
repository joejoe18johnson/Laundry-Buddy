import AsyncStorage from '@react-native-async-storage/async-storage'
import { getFilterAreaCenter } from './belizeDistricts'
import { DEFAULT_HOST_PRICING } from './hostPricing'
import type { Host, HostListing, HostSettings, User } from '../types'

const DYNAMIC_HOSTS_KEY = 'laundry-buddy-dynamic-hosts'

let runtimeDynamicHosts: Host[] = []

export function setRuntimeDynamicHosts(hosts: Host[]) {
  runtimeDynamicHosts = hosts
}

export function getRuntimeDynamicHosts(): Host[] {
  return runtimeDynamicHosts
}

export function hostIdForUser(userId: string, existing?: Host | null): string {
  if (existing?.id) return existing.id
  if (userId.startsWith('user-')) return `host-${userId}`
  return `host-${userId.slice(0, 8)}`
}

export function resolveHostCoordinates(listing: HostListing): { latitude: number; longitude: number } {
  if (listing.latitude != null && listing.longitude != null) {
    return { latitude: listing.latitude, longitude: listing.longitude }
  }

  const center = listing.location.trim() ? getFilterAreaCenter(listing.location) : null
  if (center) {
    return { latitude: center.latitude, longitude: center.longitude }
  }

  return { latitude: 17.251, longitude: -88.759 }
}

export function buildHostFromUserSettings(
  user: User,
  settings: HostSettings,
  existing?: Host | null,
): Host {
  const listing = settings.listing
  const coords = resolveHostCoordinates(listing)

  return {
    id: hostIdForUser(user.id, existing),
    hostUserId: user.id,
    name: user.name,
    location: listing.location.trim() || existing?.location || 'Belize',
    district: listing.district.trim() || existing?.district,
    rating: existing?.rating ?? 5,
    reviewCount: existing?.reviewCount ?? 0,
    price: settings.pricing.dryPrice ?? DEFAULT_HOST_PRICING.dryPrice,
    foldingPrice: settings.pricing.foldingPrice ?? DEFAULT_HOST_PRICING.foldingPrice,
    sheetsPrice: settings.pricing.sheetsPrice ?? DEFAULT_HOST_PRICING.sheetsPrice,
    slotsLeft: listing.slotsLeft ?? existing?.slotsLeft ?? 1,
    turnaroundHours: listing.turnaroundHours ?? existing?.turnaroundHours ?? 24,
    dryerType: existing?.dryerType ?? 'Standard',
    hasGenerator: listing.hasGenerator ?? existing?.hasGenerator ?? false,
    address: listing.address.trim() || existing?.address || listing.location.trim(),
    gateCode: listing.gateCode.trim() || existing?.gateCode || '',
    whatsapp: listing.whatsapp.trim() || existing?.whatsapp || '',
    latitude: coords.latitude,
    longitude: coords.longitude,
    photos: listing.setup.length > 0 ? listing.setup : existing?.photos ?? [],
    rules: listing.rules.length > 0 ? listing.rules : existing?.rules ?? [],
  }
}

export async function loadDynamicHosts(): Promise<Host[]> {
  const raw = await AsyncStorage.getItem(DYNAMIC_HOSTS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Host[]
  } catch {
    return []
  }
}

export async function saveDynamicHosts(hosts: Host[]): Promise<void> {
  await AsyncStorage.setItem(DYNAMIC_HOSTS_KEY, JSON.stringify(hosts))
  setRuntimeDynamicHosts(hosts)
}

export async function upsertDynamicHost(host: Host): Promise<void> {
  const all = await loadDynamicHosts()
  const index = all.findIndex(
    (entry) => entry.id === host.id || (host.hostUserId && entry.hostUserId === host.hostUserId),
  )
  if (index >= 0) {
    all[index] = host
  } else {
    all.push(host)
  }
  await saveDynamicHosts(all)
}

export async function removeDynamicHostForUser(userId: string): Promise<void> {
  const all = await loadDynamicHosts()
  const next = all.filter((entry) => entry.hostUserId !== userId)
  await saveDynamicHosts(next)
}
