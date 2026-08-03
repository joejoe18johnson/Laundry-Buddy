import { hasReviewForBookingInSupabase } from './supabase/reviewService'
import { isSupabaseConfigured } from './supabase/config'
import { hasReviewedBooking, markBookingReviewed } from './reviewStorage'

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
