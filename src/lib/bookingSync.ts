import { saveBookingSnapshot } from './bookingSyncStorage'
import { isSupabaseConfigured } from './supabase'
import { upsertBookingToSupabase } from './supabase/bookingService'
import type { Booking } from '../types'

/** Persist booking locally and to Supabase so other devices see the same order state. */
export async function persistBooking(booking: Booking): Promise<void> {
  await saveBookingSnapshot(booking)

  if (!isSupabaseConfigured()) return

  try {
    await upsertBookingToSupabase(booking)
  } catch (error) {
    console.warn('[bookingSync] Supabase upsert failed:', error)
    throw error
  }
}

/** Persist booking locally and to Supabase (fire-and-forget with optional error callback). */
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
