import { ALL_DROP_OFF_HOURS } from '../lib/dropOffAvailability'
import type { Booking, Host, HostProfileDetails, HostRequest, HostSettings, IdentityVerification, User } from '../types'
import { GENERATED_SEED_HOSTS } from './generatedHosts'

/** Bump when seed data changes so AsyncStorage refreshes for training. */
export const SEED_DATA_VERSION = '22'

/** Shared Ana (guest) ↔ Maria (host) demo loads — same ids on both accounts. */
export const DEMO_ANA_MARIA_BOOKING_ID = 'demo-ana-maria-1'
export const DEMO_ANA_MARIA_PAY_BOOKING_ID = 'demo-ana-maria-2'
export const DEMO_ANA_MARIA_BOOKING_IDS = [DEMO_ANA_MARIA_BOOKING_ID, DEMO_ANA_MARIA_PAY_BOOKING_ID] as const

/** Load 1 — Maria sends the payment request (accepted, transfer pending). */
export const DEMO_ANA_MARIA_BOOKING: Booking = {
  id: DEMO_ANA_MARIA_BOOKING_ID,
  hostId: 'maria',
  hostName: 'Maria',
  customerId: 'user-ana',
  customerName: 'Ana',
  location: 'Las Flores',
  loads: 1,
  dropOffTime: 9,
  sheetsOption: 'own',
  notes: 'Mostly towels — please use low heat.',
  paymentMethod: 'bank_transfer',
  foldingService: false,
  pricePerLoad: 3,
  dryPrice: 3,
  foldingPrice: 3,
  sheetsPrice: 1,
  totalAmount: 3,
  paymentStatus: 'pending',
  paymentRequestedAt: '2026-07-18T12:40:00.000Z',
  requestStatus: 'accepted',
  stage: 'got-bag',
  address: '22 Coconut St.',
  gateCode: '4421',
  stageTimes: {},
  acceptedAt: '8:05 AM',
  createdAt: '2026-07-18T12:30:00.000Z',
  clothesList: [
    { id: 'demo-ana-towels', label: 'Towels', quantity: 4 },
    { id: 'demo-ana-delicates', label: 'Delicates', quantity: 2 },
  ],
}

/** Load 2 — Payment request already sent; Ana submits transfer proof here. */
export const DEMO_ANA_MARIA_PAY_BOOKING: Booking = {
  id: DEMO_ANA_MARIA_PAY_BOOKING_ID,
  hostId: 'maria',
  hostName: 'Maria',
  customerId: 'user-ana',
  customerName: 'Ana',
  location: 'Las Flores',
  loads: 1,
  dropOffTime: 14,
  sheetsOption: 'none',
  notes: 'Work shirts — hang dry if possible.',
  paymentMethod: 'bank_transfer',
  foldingService: true,
  pricePerLoad: 3,
  dryPrice: 3,
  foldingPrice: 3,
  sheetsPrice: 1,
  totalAmount: 6,
  paymentStatus: 'pending',
  paymentRequestedAt: '2026-07-18T15:00:00.000Z',
  requestStatus: 'accepted',
  stage: 'got-bag',
  address: '22 Coconut St.',
  gateCode: '4421',
  stageTimes: {},
  acceptedAt: '1:40 PM',
  createdAt: '2026-07-18T14:20:00.000Z',
  clothesList: [{ id: 'demo-ana-shirts', label: 'Work shirts', quantity: 5 }],
}

const VERIFIED_GUEST: IdentityVerification = {
  status: 'verified',
  phoneVerified: true,
  verifiedPhone: '5016001111',
  idType: 'passport',
  idUploaded: true,
  submittedAt: '2026-06-01T10:00:00.000Z',
}

const VERIFIED_HOST: IdentityVerification = {
  status: 'verified',
  phoneVerified: true,
  verifiedPhone: '5016001234',
  idType: 'passport',
  idUploaded: true,
  addressUploaded: true,
  address: '22 Coconut St., Las Flores, Cayo',
  submittedAt: '2026-06-15T10:00:00.000Z',
}

export const TRAINING_PASSWORD = 'demo1234'

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
    phone: '5016001111',
    email: 'ana@ub.edu.bz',
    password: TRAINING_PASSWORD,
    role: 'customer',
    identityVerification: VERIFIED_GUEST,
  },
  {
    id: 'user-maria',
    name: 'Maria',
    email: 'maria@example.com',
    phone: '5016001234',
    password: TRAINING_PASSWORD,
    role: 'host',
    identityVerification: VERIFIED_HOST,
  },
]

export const SEED_HOSTS: Host[] = [
  {
    id: 'maria',
    hostUserId: 'user-maria',
    name: 'Maria',
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

export const SEED_HOST_DASHBOARDS: Record<string, HostDashboardSeed> = {
  'user-maria': {
    loadsToday: 1,
    maxLoads: 4,
    accepting: true,
    pendingRequests: [],
    activeLoads: [{ ...DEMO_ANA_MARIA_BOOKING }, { ...DEMO_ANA_MARIA_PAY_BOOKING }],
  },
}

/** Pre-loaded bookings when a customer logs in (training shortcut). */
export const SEED_CUSTOMER_BOOKINGS: Record<string, Booking[]> = {
  'user-ana': [{ ...DEMO_ANA_MARIA_BOOKING }, { ...DEMO_ANA_MARIA_PAY_BOOKING }],
}

export const SEED_CUSTOMER_HISTORY: Record<string, Booking[]> = {
  'user-ana': [
    {
      id: 'past-ana-1',
      hostId: 'maria',
      hostName: 'Maria',
      customerId: 'user-ana',
      customerName: 'Ana',
      location: 'Las Flores',
      loads: 2,
      dropOffTime: 9,
      sheetsOption: 'none',
      notes: '',
      stage: 'ready',
      address: '22 Coconut St.',
      gateCode: '4421',
      stageTimes: { 'got-bag': '8:45am', waiting: '9:00am', drying: '9:30am', ready: '11:00am' },
      completedAt: 'Jun 29, 2026',
      pricePerLoad: 3,
      totalAmount: 6,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'paid',
    },
  ],
}

export const SEED_HOST_HISTORY: Record<string, Booking[]> = {
  'user-maria': [
    {
      id: 'past-maria-1',
      hostId: 'maria',
      hostName: 'Maria',
      customerId: 'user-ana',
      customerName: 'Ana',
      location: 'Las Flores',
      loads: 2,
      dropOffTime: 14,
      sheetsOption: 'none',
      notes: '',
      stage: 'ready',
      address: '22 Coconut St.',
      gateCode: '4421',
      stageTimes: { 'got-bag': '2:15pm', waiting: '2:40pm', drying: '3:10pm', ready: '4:30pm' },
      completedAt: 'Jun 29, 2026',
      pricePerLoad: 3,
      totalAmount: 6,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'paid',
    },
  ],
}

export const TRAINING_ACCOUNTS = [
  { label: 'Ana (guest)', login: '6001111', type: 'phone' as const },
  { label: 'Maria (host)', login: 'maria@example.com', type: 'email' as const },
] as const

export const TRAINING_DEMO_STEPS = [
  'Maria → Accept a bank-transfer order (payment request sends automatically)',
  'Ana → My loads → Load 2 → Pay now → submit transfer proof',
  'Maria → Confirm payment → start drying → mark ready → confirm pickup',
]

export function getAvailableHosts(): Host[] {
  const verifiedUserIds = new Set(
    SEED_USERS.filter((u) => u.identityVerification?.status === 'verified').map((u) => u.id),
  )
  const handPicked = SEED_HOSTS.filter(
    (h) => h.hostUserId && verifiedUserIds.has(h.hostUserId) && h.slotsLeft > 0,
  )
  const generated = GENERATED_SEED_HOSTS.filter((h) => h.slotsLeft > 0)
  return [...handPicked, ...generated]
}

export function getHostByUserId(userId: string): Host | undefined {
  return (
    SEED_HOSTS.find((h) => h.hostUserId === userId) ??
    GENERATED_SEED_HOSTS.find((h) => h.hostUserId === userId)
  )
}

export function getHostById(hostId: string): Host | undefined {
  return SEED_HOSTS.find((h) => h.id === hostId) ?? GENERATED_SEED_HOSTS.find((h) => h.id === hostId)
}

export function getHostProfileDetails(hostId: string): HostProfileDetails {
  if (hostId.startsWith('gen-')) {
    const host = getHostById(hostId)
    return {
      bio: host
        ? `Community dryer host in ${host.location}, ${host.district ?? 'Belize'}.`
        : 'Community host on Laundry Buddy.',
      memberSince: '2025',
      loadsHosted: 12 + (hostId.length * 3) % 80,
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
