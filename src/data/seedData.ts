import type { Booking, Host, HostRequest, User } from '../types'

/** Bump when seed data changes so AsyncStorage refreshes for training. */
export const SEED_DATA_VERSION = '5'

export const TRAINING_PASSWORD = 'demo1234'

/** Active service area — more districts (Orange Walk, Belize, etc.) coming later. */
export const ACTIVE_DISTRICT = 'Cayo'
export const ACTIVE_REGION_LABEL = 'Cayo Area'

export const WEATHER = {
  headline: 'Rainy week ahead',
  detail: `3 days of rain forecast · 12 people searching in ${ACTIVE_REGION_LABEL}`,
}

export const SEED_USERS: User[] = [
  // ── Customers ──
  {
    id: 'user-ana',
    name: 'Ana',
    phone: '5016001111',
    email: 'ana@ub.edu.bz',
    password: TRAINING_PASSWORD,
    role: 'customer',
  },
  {
    id: 'user-carlos',
    name: 'Carlos',
    phone: '5016002222',
    email: 'carlos@gmail.com',
    password: TRAINING_PASSWORD,
    role: 'customer',
  },
  {
    id: 'user-keisha',
    name: 'Keisha',
    phone: '5016003333',
    email: 'keisha@ub.edu.bz',
    password: TRAINING_PASSWORD,
    role: 'customer',
  },
  {
    id: 'user-james-guest',
    name: 'James',
    phone: '5016004444',
    password: TRAINING_PASSWORD,
    role: 'customer',
  },
  {
    id: 'user-rosa',
    name: 'Rosa',
    email: 'rosa.mopan@gmail.com',
    password: TRAINING_PASSWORD,
    role: 'customer',
  },
  // ── Hosts (verified) ──
  {
    id: 'user-maria',
    name: 'Maria',
    email: 'maria@example.com',
    phone: '5016001234',
    password: TRAINING_PASSWORD,
    role: 'host',
    hostVerification: {
      status: 'verified',
      idUploaded: true,
      addressUploaded: true,
      address: '22 Coconut St., Las Flores, Cayo',
      submittedAt: '2026-06-15T10:00:00.000Z',
    },
  },
  {
    id: 'user-lopez',
    name: 'Mr. Lopez',
    email: 'lopez@example.com',
    phone: '5016005678',
    password: TRAINING_PASSWORD,
    role: 'host',
    hostVerification: {
      status: 'verified',
      idUploaded: true,
      addressUploaded: true,
      address: '14 University Drive, UB Area, Cayo',
      submittedAt: '2026-06-20T14:00:00.000Z',
    },
  },
  {
    id: 'user-castillo',
    name: 'Mrs. Castillo',
    email: 'castillo@example.com',
    phone: '5016007890',
    password: TRAINING_PASSWORD,
    role: 'host',
    hostVerification: {
      status: 'verified',
      idUploaded: true,
      addressUploaded: true,
      address: '8 Hattieville Rd., Cayo',
      submittedAt: '2026-07-01T09:00:00.000Z',
    },
  },
  {
    id: 'user-rupert',
    name: 'Don Rupert',
    phone: '5016009012',
    password: TRAINING_PASSWORD,
    role: 'host',
    hostVerification: {
      status: 'verified',
      idUploaded: true,
      addressUploaded: true,
      address: '3 Mile Roaring Creek, Cayo',
      submittedAt: '2026-07-05T11:00:00.000Z',
    },
  },
  // ── Hosts (verification states for training) ──
  {
    id: 'user-sandra',
    name: 'Sandra',
    phone: '5016003456',
    email: 'sandra@example.com',
    password: TRAINING_PASSWORD,
    role: 'host',
    hostVerification: {
      status: 'pending',
      idUploaded: true,
      addressUploaded: true,
      address: '5 Salvapan Lane, Cayo',
      submittedAt: '2026-07-12T16:00:00.000Z',
    },
  },
  {
    id: 'user-james-host',
    name: 'James',
    email: 'james.host@example.com',
    phone: '5016004567',
    password: TRAINING_PASSWORD,
    role: 'host',
    hostVerification: {
      status: 'rejected',
      idUploaded: true,
      addressUploaded: true,
      address: '12 Maya Mopan Blvd., Cayo',
      submittedAt: '2026-07-10T08:00:00.000Z',
    },
  },
]

export const SEED_HOSTS: Host[] = [
  {
    id: 'maria',
    hostUserId: 'user-maria',
    name: 'Maria',
    location: 'Las Flores',
    distanceKm: 0.8,
    rating: 4.9,
    reviewCount: 47,
    price: 0,
    slotsLeft: 3,
    turnaroundHours: 3,
    dryerType: 'Electric',
    hasGenerator: false,
    address: '22 Coconut St.',
    gateCode: '4421',
    whatsapp: '5016001234',
    photos: ['Clean laundry room', 'Samsung dryer', 'Covered porch drop-off'],
    rules: ['Drop off in labeled bag', 'No high heat unless noted', 'Pick up within 24 hrs'],
  },
  {
    id: 'lopez',
    hostUserId: 'user-lopez',
    name: 'Mr. Lopez',
    location: 'UB Area',
    distanceKm: 1.2,
    rating: 5.0,
    reviewCount: 31,
    price: 0,
    slotsLeft: 2,
    turnaroundHours: 4,
    dryerType: 'Electric',
    hasGenerator: true,
    foldingExtra: 5,
    address: '14 University Drive',
    gateCode: '8890',
    whatsapp: '5016005678',
    photos: ['Generator backup', 'Folding table available', 'Easy parking'],
    rules: ['Ring bell on arrival', 'Folding service +$5 optional', 'Cash for extras only'],
  },
  {
    id: 'castillo',
    hostUserId: 'user-castillo',
    name: 'Mrs. Castillo',
    location: 'Hattieville',
    distanceKm: 2.4,
    rating: 4.8,
    reviewCount: 22,
    price: 0,
    slotsLeft: 4,
    turnaroundHours: 3,
    dryerType: 'Gas',
    hasGenerator: false,
    address: '8 Hattieville Rd.',
    gateCode: '1102',
    whatsapp: '5016007890',
    photos: ['Gas dryer — fast cycles', 'Quiet neighborhood', 'Shaded waiting area'],
    rules: ['Text when arriving', 'Separate colors please', 'Pick up by 6pm'],
  },
  {
    id: 'rupert',
    hostUserId: 'user-rupert',
    name: 'Don Rupert',
    location: 'Roaring Creek',
    distanceKm: 5.1,
    rating: 4.7,
    reviewCount: 18,
    price: 0,
    slotsLeft: 1,
    turnaroundHours: 5,
    dryerType: 'Electric',
    hasGenerator: true,
    address: '3 Mile Roaring Creek',
    gateCode: '7733',
    whatsapp: '5016009012',
    photos: ['Large capacity dryer', 'Generator for outages', 'Country porch drop-off'],
    rules: ['Call before coming', 'Heavy loads OK', 'Weekends busiest'],
  },
  {
    id: 'sandra',
    hostUserId: 'user-sandra',
    name: 'Sandra',
    location: 'Salvapan',
    distanceKm: 1.8,
    rating: 0,
    reviewCount: 0,
    price: 0,
    slotsLeft: 0,
    turnaroundHours: 3,
    dryerType: 'Electric',
    hasGenerator: false,
    address: '5 Salvapan Lane',
    gateCode: '2200',
    whatsapp: '5016003456',
    photos: ['New host — setup coming soon'],
    rules: ['Verification in progress'],
  },
]

export interface HostDashboardSeed {
  loadsToday: number
  maxLoads: number
  accepting: boolean
  pendingRequests: HostRequest[]
  activeLoads: Booking[]
}

export const SEED_HOST_DASHBOARDS: Record<string, HostDashboardSeed> = {
  'user-maria': {
    loadsToday: 2,
    maxLoads: 4,
    accepting: true,
    pendingRequests: [
      {
        id: 'req-ana',
        customerId: 'user-ana',
        customerName: 'Ana',
        location: 'UB',
        loads: 1,
        dropOffTime: 'before-10',
        sheetsOption: 'own',
        status: 'pending',
      },
      {
        id: 'req-rosa',
        customerId: 'user-rosa',
        customerName: 'Rosa',
        location: 'Maya Mopan',
        loads: 2,
        dropOffTime: 'after-4',
        sheetsOption: 'buy',
        status: 'pending',
      },
    ],
    activeLoads: [
      {
        id: 'load-carlos',
        hostId: 'maria',
        hostName: 'Maria',
        customerId: 'user-carlos',
        customerName: 'Carlos',
        location: 'Las Flores',
        loads: 1,
        dropOffTime: '2pm-4pm',
        sheetsOption: 'own',
        notes: 'Gym clothes — low heat please',
        stage: 'drying',
        address: '22 Coconut St.',
        gateCode: '4421',
        stageTimes: { 'got-bag': '9:12am', waiting: '9:45am', drying: '10:05am' },
      },
    ],
  },
  'user-lopez': {
    loadsToday: 1,
    maxLoads: 3,
    accepting: true,
    pendingRequests: [
      {
        id: 'req-keisha',
        customerId: 'user-keisha',
        customerName: 'Keisha',
        location: 'UB Dorms',
        loads: 1,
        dropOffTime: '2pm-4pm',
        sheetsOption: 'none',
        status: 'pending',
      },
    ],
    activeLoads: [],
  },
  'user-castillo': {
    loadsToday: 0,
    maxLoads: 4,
    accepting: true,
    pendingRequests: [],
    activeLoads: [],
  },
  'user-rupert': {
    loadsToday: 3,
    maxLoads: 3,
    accepting: false,
    pendingRequests: [],
    activeLoads: [
      {
        id: 'load-james',
        hostId: 'rupert',
        hostName: 'Don Rupert',
        customerId: 'user-james-guest',
        customerName: 'James',
        location: 'Roaring Creek',
        loads: 2,
        dropOffTime: 'before-10',
        sheetsOption: 'own',
        notes: '',
        stage: 'waiting',
        address: '3 Mile Roaring Creek',
        gateCode: '7733',
        stageTimes: { 'got-bag': '8:30am' },
      },
    ],
  },
}

/** Pre-loaded booking when a customer logs in (training shortcut). */
export const SEED_CUSTOMER_BOOKINGS: Record<string, Booking> = {
  'user-carlos': {
    id: 'load-carlos',
    hostId: 'maria',
    hostName: 'Maria',
    customerId: 'user-carlos',
    customerName: 'Carlos',
    location: 'Las Flores',
    loads: 1,
    dropOffTime: '2pm-4pm',
    sheetsOption: 'own',
    notes: 'Gym clothes — low heat please',
    stage: 'drying',
    address: '22 Coconut St.',
    gateCode: '4421',
    stageTimes: { 'got-bag': '9:12am', waiting: '9:45am', drying: '10:05am' },
  },
}

export const TRAINING_ACCOUNTS = [
  { label: 'Ana (guest)', login: '6001111', type: 'phone' as const },
  { label: 'Carlos (guest, active load)', login: 'carlos@gmail.com', type: 'email' as const },
  { label: 'Keisha (guest)', login: 'keisha@ub.edu.bz', type: 'email' as const },
  { label: 'Maria (host)', login: 'maria@example.com', type: 'email' as const },
  { label: 'Mr. Lopez (host)', login: 'lopez@example.com', type: 'email' as const },
  { label: 'Mrs. Castillo (host)', login: 'castillo@example.com', type: 'email' as const },
  { label: 'Don Rupert (host, full)', login: '6009012', type: 'phone' as const },
  { label: 'Sandra (host, pending)', login: '6003456', type: 'phone' as const },
  { label: 'James (host, rejected)', login: 'james.host@example.com', type: 'email' as const },
]

export function getAvailableHosts(): Host[] {
  const verifiedUserIds = new Set(
    SEED_USERS.filter((u) => u.hostVerification?.status === 'verified').map((u) => u.id),
  )
  return SEED_HOSTS.filter(
    (h) => h.hostUserId && verifiedUserIds.has(h.hostUserId) && h.slotsLeft > 0,
  )
}

export function getHostByUserId(userId: string): Host | undefined {
  return SEED_HOSTS.find((h) => h.hostUserId === userId)
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

export function getCustomerSeedBooking(userId: string): Booking | null {
  return SEED_CUSTOMER_BOOKINGS[userId] ?? null
}
