import type { Booking } from '../types'

export function isActiveGuestBooking(booking: Booking): boolean {
  return booking.requestStatus !== 'declined' && booking.stage !== 'picked-up'
}

export function filterActiveGuestBookings(bookings: Booking[]): Booking[] {
  return bookings.filter(isActiveGuestBooking)
}

export function upsertGuestBooking(bookings: Booking[], booking: Booking): Booking[] {
  const index = bookings.findIndex((entry) => entry.id === booking.id)
  if (index < 0) return [...bookings, booking]
  const next = [...bookings]
  next[index] = booking
  return next
}

export function removeGuestBooking(bookings: Booking[], bookingId: string): Booking[] {
  return bookings.filter((entry) => entry.id !== bookingId)
}

export function patchGuestBooking(
  bookings: Booking[],
  bookingId: string,
  patch: (booking: Booking) => Booking,
): Booking[] {
  return bookings.map((entry) => (entry.id === bookingId ? patch(entry) : entry))
}

export function findGuestBooking(bookings: Booking[], bookingId: string): Booking | undefined {
  return bookings.find((entry) => entry.id === bookingId)
}

export function mergeGuestBookings(...lists: Booking[][]): Booking[] {
  const byId = new Map<string, Booking>()
  for (const list of lists) {
    for (const booking of list) {
      byId.set(booking.id, booking)
    }
  }
  return [...byId.values()]
}

export function filterVisibleGuestBookings(bookings: Booking[]): Booking[] {
  return bookings.filter((booking) => booking.requestStatus !== 'declined')
}
