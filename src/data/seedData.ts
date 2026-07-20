import type { Booking, Host, HostProfileDetails, HostRequest, HostSettings, User } from '../types'
import { getRuntimeDynamicHosts } from '../lib/dynamicHosts'

/** Bump when seed data changes so AsyncStorage refreshes. */
export const SEED_DATA_VERSION = '28'

/** Bootstrap password for the local admin account (also used for Supabase auto-provisioning). */
export const ADMIN_SEED_PASSWORD = 'demo1234'

/** @deprecated Use ADMIN_SEED_PASSWORD */
export const TRAINING_PASSWORD = ADMIN_SEED_PASSWORD

/** App coverage — community dryer sharing across all of Belize. */
export const ACTIVE_REGION_LABEL = 'Belize'

export const WEATHER = {
  headline: 'Rainy week ahead',
  detail: '3 days of rain forecast · hosts in every district',
}

export const SEED_USERS: User[] = [
  {
    id: 'user-support-admin',
    name: 'Support Admin',
    email: 'support@laundrybuddy.app',
    password: ADMIN_SEED_PASSWORD,
    role: 'admin',
    identityVerification: {
      status: 'verified',
      phoneVerified: true,
      idUploaded: true,
    },
  },
]

export const SEED_HOSTS: Host[] = []

export const SEED_HOST_SETTINGS: Record<string, Partial<HostSettings>> = {}

export const SEED_HOST_PROFILES: Record<string, HostProfileDetails> = {}

export interface HostDashboardSeed {
  loadsToday: number
  maxLoads: number
  accepting: boolean
  pendingRequests: HostRequest[]
  activeLoads: Booking[]
}

export const SEED_HOST_DASHBOARDS: Record<string, HostDashboardSeed> = {}

export const SEED_CUSTOMER_BOOKINGS: Record<string, Booking[]> = {}

export const SEED_CUSTOMER_HISTORY: Record<string, Booking[]> = {}

export const SEED_HOST_HISTORY: Record<string, Booking[]> = {}

export function getAvailableHosts(): Host[] {
  return getRuntimeDynamicHosts().filter((h) => h.slotsLeft > 0)
}

export function getHostByUserId(userId: string): Host | undefined {
  return (
    SEED_HOSTS.find((h) => h.hostUserId === userId) ??
    getRuntimeDynamicHosts().find((h) => h.hostUserId === userId)
  )
}

export function getHostById(hostId: string): Host | undefined {
  return (
    SEED_HOSTS.find((h) => h.id === hostId) ??
    getRuntimeDynamicHosts().find((h) => h.id === hostId)
  )
}

export function getHostProfileDetails(hostId: string): HostProfileDetails {
  const host = getHostById(hostId)
  if (host) {
    return {
      bio: `Community dryer host in ${host.location}${host.district ? `, ${host.district}` : ''}.`,
      memberSince: '2025',
      loadsHosted: 0,
      responseTime: 'Under 2 hrs',
      reviews: [],
    }
  }

  return {
    bio: 'Community host on Laundry Buddy.',
    memberSince: '2025',
    loadsHosted: 0,
    responseTime: '—',
    reviews: [],
  }
}

export function getHostDashboardSeed(userId: string): HostDashboardSeed {
  return (
    SEED_HOST_DASHBOARDS[userId] ?? {
      loadsToday: 0,
      maxLoads: 4,
      accepting: true,
      pendingRequests: [],
      activeLoads: [],
    }
  )
}

export function getCustomerSeedBookings(userId: string): Booking[] {
  return SEED_CUSTOMER_BOOKINGS[userId] ?? []
}

export function getCustomerSeedBooking(userId: string): Booking | null {
  return getCustomerSeedBookings(userId)[0] ?? null
}

export function getCustomerHistory(userId: string): Booking[] {
  return SEED_CUSTOMER_HISTORY[userId] ?? []
}

export function getHostHistory(userId: string): Booking[] {
  return SEED_HOST_HISTORY[userId] ?? []
}
