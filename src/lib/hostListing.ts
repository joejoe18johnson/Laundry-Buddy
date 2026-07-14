import type { Host, HostListing, HostSettings } from '../types'
import { applyHostPricing } from './hostPricing'

export const EMPTY_HOST_LISTING: HostListing = {
  bio: '',
  location: '',
  district: '',
  address: '',
  gateCode: '',
  whatsapp: '',
  turnaroundHours: 3,
  slotsLeft: 2,
  hasGenerator: false,
  setup: [],
  rules: [],
}

export function defaultListingFromHost(host: Host, bio = ''): HostListing {
  return {
    bio,
    location: host.location,
    district: host.district ?? '',
    address: host.address,
    gateCode: host.gateCode,
    whatsapp: host.whatsapp,
    turnaroundHours: host.turnaroundHours,
    slotsLeft: host.slotsLeft,
    hasGenerator: host.hasGenerator,
    setup: [...host.photos],
    rules: [...host.rules],
  }
}

export function normalizeListing(
  listing: Partial<HostListing> | undefined,
  host?: Host | null,
  bio?: string,
): HostListing {
  const base = host ? defaultListingFromHost(host, bio ?? '') : { ...EMPTY_HOST_LISTING }
  if (!listing) return base

  return {
    ...base,
    ...listing,
    setup: listing.setup ?? base.setup,
    rules: listing.rules ?? base.rules,
  }
}

export function applyHostListing(host: Host, settings?: HostSettings): Host {
  const listing = settings?.listing
  if (!listing) return host

  return {
    ...host,
    location: listing.location.trim() || host.location,
    district: listing.district.trim() || host.district,
    address: listing.address.trim() || host.address,
    gateCode: listing.gateCode.trim() || host.gateCode,
    whatsapp: listing.whatsapp.trim() || host.whatsapp,
    turnaroundHours: listing.turnaroundHours ?? host.turnaroundHours,
    slotsLeft: listing.slotsLeft ?? host.slotsLeft,
    hasGenerator: listing.hasGenerator ?? host.hasGenerator,
    photos: listing.setup.length > 0 ? listing.setup : host.photos,
    rules: listing.rules.length > 0 ? listing.rules : host.rules,
  }
}

export function applyHostSettings(host: Host, settings?: HostSettings): Host {
  if (!settings) return host
  return applyHostListing(applyHostPricing(host, settings), settings)
}

export function parseListingInt(value: string, fallback: number): number {
  const n = parseInt(value.replace(/\D/g, ''), 10)
  return Number.isFinite(n) ? Math.max(0, n) : fallback
}
