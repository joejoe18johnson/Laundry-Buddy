import AsyncStorage from '@react-native-async-storage/async-storage'
import { isPickupComplete, normalizePickupStage } from './pickupConfirmation'
import type { Booking } from '../types'

const KEY = 'laundry-buddy-booking-snapshots'

const STAGE_ORDER = ['got-bag', 'waiting', 'drying', 'ready', 'picked-up'] as const

async function readMap(): Promise<Record<string, Booking>> {
  const raw = await AsyncStorage.getItem(KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, Booking>
  } catch {
    return {}
  }
}

async function writeMap(map: Record<string, Booking>): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(map))
}

function mergeRequestStatus(
  a?: Booking['requestStatus'],
  b?: Booking['requestStatus'],
): NonNullable<Booking['requestStatus']> {
  if (a === 'accepted' || b === 'accepted') return 'accepted'
  if (a === 'declined' || b === 'declined') return 'declined'
  return a ?? b ?? 'pending'
}

function latestIso(a?: string, b?: string): string | undefined {
  if (!a) return b
  if (!b) return a
  return Date.parse(a) >= Date.parse(b) ? a : b
}

/** Merge booking state from two sources — never regress accepted → pending. */
export function mergeBookingSnapshot(a: Booking, b: Booking): Booking {
  const stageIdx = Math.max(STAGE_ORDER.indexOf(a.stage), STAGE_ORDER.indexOf(b.stage))
  const stage = STAGE_ORDER[Math.max(0, stageIdx)] ?? a.stage

  return normalizePickupStage({
    ...a,
    ...b,
    requestStatus: mergeRequestStatus(a.requestStatus, b.requestStatus),
    stage,
    customerId: a.customerId ?? b.customerId,
    customerName: a.customerName ?? b.customerName,
    acceptedAt: latestIso(a.acceptedAt, b.acceptedAt),
    completedAt: latestIso(a.completedAt, b.completedAt),
    paymentProofSentAt: latestIso(a.paymentProofSentAt, b.paymentProofSentAt),
    paymentRequestedAt: latestIso(a.paymentRequestedAt, b.paymentRequestedAt),
    guestPickupConfirmedAt: latestIso(a.guestPickupConfirmedAt, b.guestPickupConfirmedAt),
    hostPickupConfirmedAt: latestIso(a.hostPickupConfirmedAt, b.hostPickupConfirmedAt),
    paymentStatus:
      a.paymentStatus === 'paid' || b.paymentStatus === 'paid'
        ? 'paid'
        : a.paymentStatus ?? b.paymentStatus,
    stageTimes: { ...a.stageTimes, ...b.stageTimes },
    loadPhotoUri: b.loadPhotoUri ?? a.loadPhotoUri,
    dryPhotoUri: b.dryPhotoUri ?? a.dryPhotoUri,
    clothesList: b.clothesList ?? a.clothesList,
    createdAt: a.createdAt ?? b.createdAt,
  })
}

export async function saveBookingSnapshot(booking: Booking): Promise<void> {
  const map = await readMap()
  map[booking.id] = normalizePickupStage(booking)
  await writeMap(map)
}

export async function removeBookingSnapshot(bookingId: string): Promise<void> {
  const map = await readMap()
  if (!(bookingId in map)) return
  delete map[bookingId]
  await writeMap(map)
}

export async function loadBookingSnapshot(bookingId: string): Promise<Booking | null> {
  const map = await readMap()
  const snapshot = map[bookingId]
  return snapshot ? normalizePickupStage(snapshot) : null
}

export async function loadBookingSnapshotsForCustomer(customerIds: string | string[]): Promise<Booking[]> {
  const ids = new Set(Array.isArray(customerIds) ? customerIds : [customerIds])
  const map = await readMap()
  return Object.values(map)
    .filter((booking) => booking.customerId && ids.has(booking.customerId))
    .map(normalizePickupStage)
}
