import type { Booking } from '../types'

export function isPickupComplete(booking: Booking): boolean {
  if (booking.stage === 'picked-up') return true
  return !!booking.hostPickupConfirmedAt && !!booking.guestPickupConfirmedAt
}

export function canGuestConfirmPickup(booking: Booking): boolean {
  return (
    booking.requestStatus === 'accepted' &&
    booking.stage === 'ready' &&
    !booking.guestPickupConfirmedAt
  )
}

export function canHostConfirmPickup(booking: Booking): boolean {
  return (
    booking.requestStatus === 'accepted' &&
    booking.stage === 'ready' &&
    !booking.hostPickupConfirmedAt
  )
}

export function isAwaitingGuestPickupConfirmation(booking: Booking): boolean {
  return (
    booking.stage === 'ready' &&
    !!booking.hostPickupConfirmedAt &&
    !booking.guestPickupConfirmedAt
  )
}

export function isAwaitingHostPickupConfirmation(booking: Booking): boolean {
  return (
    booking.stage === 'ready' &&
    !!booking.guestPickupConfirmedAt &&
    !booking.hostPickupConfirmedAt
  )
}

export function patchPickupConfirmation(
  booking: Booking,
  role: 'host' | 'customer',
): Booking {
  const timestamp = new Date().toISOString()
  return normalizePickupStage({
    ...booking,
    hostPickupConfirmedAt:
      role === 'host' ? timestamp : booking.hostPickupConfirmedAt,
    guestPickupConfirmedAt:
      role === 'customer' ? timestamp : booking.guestPickupConfirmedAt,
  })
}

/** When both parties confirmed pickup, advance stage so guest/host progress stays in sync. */
export function normalizePickupStage(booking: Booking): Booking {
  if (!isPickupComplete(booking)) return booking
  if (booking.stage === 'picked-up') return booking

  const time = new Date().toISOString()
  const completedDate =
    booking.completedAt ??
    new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  return {
    ...booking,
    stage: 'picked-up',
    completedAt: completedDate,
    stageTimes: {
      ...booking.stageTimes,
      'picked-up': booking.stageTimes['picked-up'] ?? time,
    },
    paymentStatus:
      booking.paymentMethod === 'cash' || booking.paymentStatus === 'paid'
        ? ('paid' as const)
        : (booking.paymentStatus ?? 'pending'),
  }
}
