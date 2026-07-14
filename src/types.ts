export type DropOffTime = 'before-10' | '2pm-4pm' | 'after-4'
export type SheetsOption = 'own' | 'buy' | 'none'
export type BookingStage = 'got-bag' | 'waiting' | 'drying' | 'ready'
export type AppRole = 'customer' | 'host'
export type LoginMethod = 'phone' | 'email'
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected'

export type AuthScreen = 'welcome' | 'login' | 'signup'

export type Screen =
  | 'customer-home'
  | 'customer-booking'
  | 'customer-host-profile'
  | 'customer-tracking'
  | 'host-dashboard'
  | 'host-mark-dry'
  | 'history'

export interface HostVerification {
  status: VerificationStatus
  idUploaded: boolean
  addressUploaded: boolean
  address: string
  submittedAt?: string
}

export interface User {
  id: string
  name: string
  phone?: string
  email?: string
  password: string
  role: AppRole
  hostVerification?: HostVerification
}

export interface Host {
  id: string
  hostUserId?: string
  name: string
  location: string
  district?: string
  distanceKm?: number
  rating: number
  reviewCount?: number
  price: number
  slotsLeft: number
  turnaroundHours: number
  dryerType: string
  hasGenerator: boolean
  foldingExtra?: number
  address: string
  gateCode: string
  photos: string[]
  rules: string[]
  whatsapp: string
}

export interface HostReview {
  id: string
  author: string
  rating: number
  comment: string
  date: string
}

export interface HostProfileDetails {
  bio: string
  memberSince: string
  loadsHosted: number
  responseTime: string
  reviews: HostReview[]
}

export interface Booking {
  id: string
  hostId: string
  hostName: string
  customerId?: string
  customerName: string
  location: string
  loads: number
  dropOffTime: DropOffTime
  sheetsOption: SheetsOption
  notes: string
  stage: BookingStage
  address: string
  gateCode: string
  stageTimes: Partial<Record<BookingStage, string>>
  isNew?: boolean
  completedAt?: string
}

export interface HostRequest {
  id: string
  customerId?: string
  customerName: string
  location: string
  loads: number
  dropOffTime: DropOffTime
  sheetsOption: SheetsOption
  status: 'pending' | 'accepted' | 'declined'
}

export const DROP_OFF_LABELS: Record<DropOffTime, string> = {
  'before-10': 'Before 10am',
  '2pm-4pm': '2pm–4pm',
  'after-4': 'After 4pm',
}

export const SHEETS_LABELS: Record<SheetsOption, string> = {
  own: 'Brings own sheets ✓',
  buy: 'Wants to buy sheets ($1)',
  none: 'No sheets please',
}
