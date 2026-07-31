import { isSupabaseConfigured } from './supabase'
import { upsertBookingToSupabase } from './supabase/bookingService'
import { saveBookingSnapshot } from './bookingSyncStorage'
import type { Booking } from '../types'

/** Persist booking — Supabase when configured, local snapshot otherwise. */
export async function persistBooking(booking: Booking): Promise<void> {
  if (isSupabaseConfigured()) {
    await upsertBookingToSupabase(booking)
    return
  }

  await saveBookingSnapshot(booking)
}

/** Persist booking (fire-and-forget with optional error callback). */
export function syncBookingToServer(
  booking: Booking,
  onError?: (message: string) => void,
): void {
  void persistBooking(booking).catch((error) => {
    const message = error instanceof Error ? error.message : 'Could not sync booking.'
    console.warn('[bookingSync] sync failed:', booking.id, message)
    onError?.(message)
  })
}
