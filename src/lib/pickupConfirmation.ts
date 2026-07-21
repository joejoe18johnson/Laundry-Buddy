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
  return {
    ...booking,
    hostPickupConfirmedAt:
      role === 'host' ? timestamp : booking.hostPickupConfirmedAt,
    guestPickupConfirmedAt:
      role === 'customer' ? timestamp : booking.guestPickupConfirmedAt,
  }
}
