import type { DropOffHour } from './lib/dropOffAvailability'

export type { DropOffHour }
export type SheetsOption = 'own' | 'buy' | 'none'
export type BookingStage = 'got-bag' | 'waiting' | 'drying' | 'ready' | 'picked-up'
export type AppRole = 'customer' | 'host' | 'admin'
export type LoginMethod = 'phone' | 'email'
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected'

export type IdDocumentType = 'passport' | 'drivers_license' | 'social_security'

export interface IdentityVerification {
  status: VerificationStatus
  phoneVerified: boolean
  verifiedPhone?: string
  idType?: IdDocumentType
  idUploaded: boolean
  idPhotoUri?: string
  address?: string
  addressUploaded?: boolean
  addressProofUri?: string
  addressProofMimeType?: string
  addressProofName?: string
  submittedAt?: string
}

/** @deprecated Use IdentityVerification on user.identityVerification */
export type HostVerification = IdentityVerification

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
  | 'messages'
  | 'account'
  | 'help'
  | 'notifications'
  | 'chat'
  | 'identity-verification'
  | 'admin-dashboard'

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
  | { screen: 'chat'; threadId: string; bookingId?: string }
  | { screen: 'identity-verification' }
  | { screen: 'admin-dashboard'; userId?: string }

export type ChatMessageKind = 'text' | 'image' | 'payment_proof' | 'system'

export interface ChatMessage {
  id: string
  threadId: string
  senderId: string
  senderName: string
  senderRole: AppRole | 'support'
  text?: string
  imageUri?: string
  kind: ChatMessageKind
  createdAt: string
}

export interface User {
  id: string
  name: string
  phone?: string
  email?: string
  password: string
  role: AppRole
  identityVerification?: IdentityVerification
  /** @deprecated Use identityVerification */
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
  paymentProofSentAt?: string
  paymentProofUri?: string
  paymentRequestedAt?: string
  requestStatus?: 'pending' | 'accepted' | 'declined'
  loadPhotoUri?: string
  dryPhotoUri?: string
  clothesList?: ClothesListItem[]
  acceptedAt?: string
  createdAt?: string
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

export function sheetsOptionLabel(option: SheetsOption, _sheetsPrice?: number): string {
  if (option === 'buy') {
    return 'Buy 2 Sheets From Host ($1 for 2 Sheets)'
  }
  return SHEETS_LABELS[option]
}

export const SHEETS_LABELS: Record<SheetsOption, string> = {
  own: 'Brings Own Sheets ✓',
  buy: 'Wants 2 Sheets From Host ($1 for 2 Sheets)',
  none: 'No Sheets Please',
}
