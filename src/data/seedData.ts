import { ALL_DROP_OFF_HOURS } from '../lib/dropOffAvailability'
import type { Booking, Host, HostProfileDetails, HostRequest, HostSettings, IdentityVerification, User } from '../types'
import { GENERATED_SEED_HOSTS } from './generatedHosts'
import { getRuntimeDynamicHosts } from '../lib/dynamicHosts'

/** Bump when seed data changes so AsyncStorage refreshes. */
export const SEED_DATA_VERSION = '31'

/** Bootstrap password for sample accounts (also used for Supabase admin auto-provisioning). */
export const ADMIN_SEED_PASSWORD = 'demo1234'

/** @deprecated Use ADMIN_SEED_PASSWORD */
export const TRAINING_PASSWORD = ADMIN_SEED_PASSWORD

export const ADMIN_EMAIL = 'support@laundrybuddy.app'
export const ADMIN_PHONE = '5016220000'

/** Sample guest account for booking flow tests (local mode). */
export const SAMPLE_GUEST_EMAIL = 'ana@ub.edu.bz'
export const SAMPLE_GUEST_PHONE = '5016001111'

/** Sample host account for host flow tests (local mode). */
export const SAMPLE_HOST_EMAIL = 'maria@example.com'
export const SAMPLE_HOST_PHONE = '5016001234'

const VERIFIED_GUEST: IdentityVerification = {
  status: 'verified',
  phoneVerified: true,
  verifiedPhone: SAMPLE_GUEST_PHONE,
  idType: 'passport',
  idUploaded: true,
  submittedAt: '2026-06-01T10:00:00.000Z',
}

const VERIFIED_HOST: IdentityVerification = {
  status: 'verified',
  phoneVerified: true,
  verifiedPhone: SAMPLE_HOST_PHONE,
  idType: 'passport',
  idUploaded: true,
  addressUploaded: true,
  address: '22 Coconut St., Las Flores, Cayo',
  submittedAt: '2026-06-15T10:00:00.000Z',
}

/** App coverage — community dryer sharing across all of Belize. */
export const ACTIVE_REGION_LABEL = 'Belize'

export const WEATHER = {
  headline: 'Rainy week ahead',
  detail: '3 days of rain forecast · hosts in every district',
}

export const SEED_USERS: User[] = [
  {
    id: 'user-ana',
    name: 'Ana',
    phone: SAMPLE_GUEST_PHONE,
    email: SAMPLE_GUEST_EMAIL,
    password: ADMIN_SEED_PASSWORD,
    role: 'customer',
    identityVerification: VERIFIED_GUEST,
  },
  {
    id: 'user-maria',
    name: 'Maria Garcia',
    email: SAMPLE_HOST_EMAIL,
    phone: SAMPLE_HOST_PHONE,
    password: ADMIN_SEED_PASSWORD,
    role: 'host',
    identityVerification: VERIFIED_HOST,
  },
  {
    id: 'user-support-admin',
    name: 'Support Admin',
    email: ADMIN_EMAIL,
    phone: ADMIN_PHONE,
    password: ADMIN_SEED_PASSWORD,
    role: 'admin',
    identityVerification: {
      status: 'verified',
      phoneVerified: true,
      idUploaded: true,
    },
  },
]

export const SEED_HOSTS: Host[] = [
  {
    id: 'maria',
    hostUserId: 'user-maria',
    name: 'Maria Garcia',
    location: 'Las Flores',
    district: 'Cayo',
    distanceKm: 0.8,
    rating: 4.9,
    reviewCount: 47,
    price: 3,
    foldingPrice: 3,
    sheetsPrice: 1,
    slotsLeft: 3,
    turnaroundHours: 2,
    dryerType: 'Electric',
    hasGenerator: false,
    address: '22 Coconut St.',
    gateCode: '4421',
    whatsapp: '5016001234',
    latitude: 17.158,
    longitude: -89.072,
    photos: ['Clean laundry room', 'Samsung dryer', 'Covered porch drop-off'],
    rules: ['Drop off in labeled bag', 'No high heat unless noted', 'Pick up within 24 hrs'],
  },
]

export const SEED_HOST_SETTINGS: Record<string, Partial<HostSettings>> = {
  'user-maria': {
    isOnline: true,
    acceptCash: true,
    acceptBankTransfer: true,
    bankDetails: {
      bankName: 'Belize Bank',
      accountName: 'Maria Flores',
      accountNumber: '1234567890',
    },
    notifyNewRequests: true,
    notifyBookingUpdates: true,
    notifyGuestsWhenOnline: true,
    pricing: { dryPrice: 3, foldingPrice: 3, sheetsPrice: 1 },
    dropOffAvailability: [...ALL_DROP_OFF_HOURS],
  },
}

export const SEED_HOST_PROFILES: Record<string, HostProfileDetails> = {
  maria: {
    bio: 'UB student sharing my home dryer with neighbors. Usually home afternoons and weekends — happy to help during rainy season.',
    memberSince: 'Jun 2025',
    loadsHosted: 124,
    responseTime: 'Under 1 hr',
    reviews: [
      {
        id: 'rev-m1',
        author: 'Ana',
        rating: 5,
        comment: 'Super friendly and my clothes came back smelling great. Drop-off was easy.',
        date: 'Jul 8, 2026',
      },
    ],
  },
}

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
  const verifiedUserIds = new Set(
    SEED_USERS.filter((u) => u.identityVerification?.status === 'verified').map((u) => u.id),
  )
  const handPicked = SEED_HOSTS.filter(
    (h) => h.hostUserId && verifiedUserIds.has(h.hostUserId) && h.slotsLeft > 0,
  )
  const generated = GENERATED_SEED_HOSTS.filter((h) => h.slotsLeft > 0)
  const dynamic = getRuntimeDynamicHosts().filter((h) => h.slotsLeft > 0)
  const seedUserIds = new Set(handPicked.map((h) => h.hostUserId).filter(Boolean))
  const mergedDynamic = dynamic.filter((h) => !h.hostUserId || !seedUserIds.has(h.hostUserId))
  return [...handPicked, ...generated, ...mergedDynamic]
}

export function getHostByUserId(userId: string): Host | undefined {
  return (
    SEED_HOSTS.find((h) => h.hostUserId === userId) ??
    GENERATED_SEED_HOSTS.find((h) => h.hostUserId === userId) ??
    getRuntimeDynamicHosts().find((h) => h.hostUserId === userId)
  )
}

export function getHostById(hostId: string): Host | undefined {
  return (
    SEED_HOSTS.find((h) => h.id === hostId) ??
    GENERATED_SEED_HOSTS.find((h) => h.id === hostId) ??
    getRuntimeDynamicHosts().find((h) => h.id === hostId)
  )
}

export function getHostProfileDetails(hostId: string): HostProfileDetails {
  if (hostId.startsWith('gen-') || hostId.startsWith('host-')) {
    const host = getHostById(hostId)
    return {
      bio: host
        ? `Community dryer host in ${host.location}${host.district ? `, ${host.district}` : ''}.`
        : 'Community host on Laundry Buddy.',
      memberSince: '2025',
      loadsHosted: hostId.startsWith('gen-') ? 12 + (hostId.length * 3) % 80 : 0,
      responseTime: 'Under 2 hrs',
      reviews: [],
    }
  }

  return (
    SEED_HOST_PROFILES[hostId] ?? {
      bio: 'Community host on Laundry Buddy.',
      memberSince: '2025',
      loadsHosted: 0,
      responseTime: '—',
      reviews: [],
    }
  )
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
