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

/** Merge host-side updates into a guest booking — remote wins when further along. */
export function mergeBookingSnapshot(local: Booking, snapshot: Booking): Booking {
  const localStageIdx = STAGE_ORDER.indexOf(local.stage)
  const snapshotStageIdx = STAGE_ORDER.indexOf(snapshot.stage)
  const snapshotAhead = snapshotStageIdx > localStageIdx
  const snapshotAccepted =
    local.requestStatus === 'pending' && snapshot.requestStatus === 'accepted'
  const snapshotPaid =
    snapshot.paymentStatus === 'paid' && local.paymentStatus !== 'paid'
  const snapshotProofSent =
    !!snapshot.paymentProofSentAt && !local.paymentProofSentAt
  const snapshotPaymentRequested =
    !!snapshot.paymentRequestedAt && !local.paymentRequestedAt
  const snapshotGuestPickup =
    !!snapshot.guestPickupConfirmedAt && !local.guestPickupConfirmedAt
  const snapshotHostPickup =
    !!snapshot.hostPickupConfirmedAt && !local.hostPickupConfirmedAt
  const snapshotPickupComplete =
    isPickupComplete(snapshot) && !isPickupComplete(local)

  if (
    !snapshotAhead &&
    !snapshotAccepted &&
    !snapshotPaid &&
    !snapshotProofSent &&
    !snapshotPaymentRequested &&
    !snapshotGuestPickup &&
    !snapshotHostPickup &&
    !snapshotPickupComplete &&
    snapshot.requestStatus === local.requestStatus
  ) {
    return local
  }

  const merged = normalizePickupStage({
    ...local,
    ...snapshot,
    customerId: local.customerId ?? snapshot.customerId,
    customerName: local.customerName ?? snapshot.customerName,
    stageTimes: { ...local.stageTimes, ...snapshot.stageTimes },
    guestPickupConfirmedAt: snapshot.guestPickupConfirmedAt ?? local.guestPickupConfirmedAt,
    hostPickupConfirmedAt: snapshot.hostPickupConfirmedAt ?? local.hostPickupConfirmedAt,
    stage: snapshotStageIdx >= localStageIdx ? snapshot.stage : local.stage,
  })

  return normalizePickupStage(merged)
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

export async function loadBookingSnapshotsForCustomer(customerId: string): Promise<Booking[]> {
  const map = await readMap()
  return Object.values(map)
    .filter((booking) => booking.customerId === customerId)
    .map(normalizePickupStage)
}
