import type { Booking } from '../types'
import { findGuestBooking } from './guestBookings'
import { isPickupComplete } from './pickupConfirmation'
import { hasReviewForBookingInSupabase } from './supabase/reviewService'
import { fetchBookingByIdFromSupabase } from './supabase/bookingService'
import { isSupabaseConfigured } from './supabase/config'
import { hasReviewedBooking, markBookingReviewed } from './reviewStorage'

/** Reviews are only for loads that were accepted and fully picked up — not cancelled or declined. */
export function canLeaveReviewForBooking(booking: Booking | null | undefined): boolean {
  if (!booking) return false
  if (booking.requestStatus !== 'accepted') return false
  return isPickupComplete(booking)
}

export async function resolveBookingReviewEligibility(
  bookingId: string,
  localBookings: Booking[],
): Promise<{ eligible: boolean; booking: Booking | null }> {
  const local = findGuestBooking(localBookings, bookingId)
  if (local) {
    return { eligible: canLeaveReviewForBooking(local), booking: local }
  }

  if (!isSupabaseConfigured()) {
    return { eligible: false, booking: null }
  }

  const remote = await fetchBookingByIdFromSupabase(bookingId)
  return { eligible: canLeaveReviewForBooking(remote), booking: remote }
}

/** True when this guest already left a review for this booking (local cache + Supabase). */
export async function hasReviewForBooking(
  userId: string,
  bookingId: string,
  resolvedAuthorId?: string,
): Promise<boolean> {
  if (await hasReviewedBooking(userId, bookingId)) return true

  if (!isSupabaseConfigured()) return false

  const authorId = resolvedAuthorId ?? userId
  const remote = await hasReviewForBookingInSupabase(authorId, bookingId)
  if (remote) {
    await markBookingReviewed(userId, bookingId)
  }
  return remote
}

export async function recordBookingReviewed(userId: string, bookingId: string): Promise<void> {
  await markBookingReviewed(userId, bookingId)
}
