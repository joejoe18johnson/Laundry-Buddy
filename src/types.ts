import type { DropOffHour } from './lib/dropOffAvailability'

export type { DropOffHour }
export type SheetsOption = 'own' | 'buy' | 'none'
export type BookingStage = 'got-bag' | 'waiting' | 'drying' | 'ready' | 'picked-up'
export type AppRole = 'customer' | 'host'
export type LoginMethod = 'phone' | 'email'
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected'

export type AuthScreen = 'welcome' | 'login' | 'signup'

export type Screen =
  | 'customer-home'
  | 'customer-booking'
  | 'customer-host-profile'
  | 'customer-tracking'
  | 'customer-leave-review'
  | 'host-dashboard'
  | 'host-mark-dry'
  | 'history'
  | 'account'
  | 'help'
  | 'notifications'

export type PaymentMethod = 'cash' | 'bank_transfer'

export interface HostBankDetails {
  bankName: string
  accountName: string
  accountNumber: string
}

export interface HostPricing {
  dryPrice: number
  foldingPrice: number
  sheetsPrice: number
}

export interface HostListing {
  bio: string
  location: string
  district: string
  address: string
  gateCode: string
  whatsapp: string
  turnaroundHours: number
  slotsLeft: number
  hasGenerator: boolean
  setup: string[]
  rules: string[]
}

export interface HostSettings {
  isOnline: boolean
  acceptCash: boolean
  acceptBankTransfer: boolean
  bankDetails: HostBankDetails
  notifyNewRequests: boolean
  notifyBookingUpdates: boolean
  notifyGuestsWhenOnline: boolean
  pricing: HostPricing
  listing: HostListing
  dropOffAvailability: DropOffHour[]
}

export interface AppNotification {
  id: string
  userId: string
  title: string
  body: string
  time: string
  read: boolean
  link?: NotificationLink
}

export type NotificationLink =
  | { screen: 'customer-tracking'; bookingId: string }
  | { screen: 'customer-leave-review'; hostId: string; bookingId?: string }
  | { screen: 'customer-host-profile'; hostId: string }
  | { screen: 'host-dashboard'; bookingId?: string }
  | { screen: 'customer-home' }
  | { screen: 'history'; bookingId?: string }

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
  foldingPrice?: number
  sheetsPrice?: number
  address: string
  gateCode: string
  photos: string[]
  rules: string[]
  whatsapp: string
  latitude: number
  longitude: number
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

export interface ClothesListItem {
  id: string
  label: string
  quantity: number
}

export interface Booking {
  id: string
  hostId: string
  hostName: string
  customerId?: string
  customerName: string
  location: string
  loads: number
  dropOffTime: DropOffHour
  sheetsOption: SheetsOption
  notes: string
  stage: BookingStage
  address: string
  gateCode: string
  stageTimes: Partial<Record<BookingStage, string>>
  isNew?: boolean
  completedAt?: string
  paymentMethod?: PaymentMethod
  pricePerLoad?: number
  dryPrice?: number
  foldingPrice?: number
  sheetsPrice?: number
  foldingService?: boolean
  totalAmount?: number
  paymentStatus?: 'paid' | 'pending'
  requestStatus?: 'pending' | 'accepted' | 'declined'
  loadPhotoUri?: string
  clothesList?: ClothesListItem[]
}

export interface HostRequest {
  id: string
  customerId?: string
  customerName: string
  location: string
  loads: number
  dropOffTime: DropOffHour
  sheetsOption: SheetsOption
  notes?: string
  paymentMethod?: PaymentMethod
  foldingService?: boolean
  totalAmount?: number
  status: 'pending' | 'accepted' | 'declined'
  createdAt?: string
  loadPhotoUri?: string
  clothesList?: ClothesListItem[]
}

export function sheetsOptionLabel(option: SheetsOption, sheetsPrice: number): string {
  if (option === 'buy') {
    return sheetsPrice <= 0 ? 'Buy sheets from host (Free)' : `Buy sheets from host ($${sheetsPrice}/load)`
  }
  return SHEETS_LABELS[option]
}

export const SHEETS_LABELS: Record<SheetsOption, string> = {
  own: 'Brings own sheets ✓',
  buy: 'Wants to buy sheets from host',
  none: 'No sheets please',
}
