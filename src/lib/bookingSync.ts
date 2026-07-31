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

export function persistBookingFireAndForget(booking: Booking): void {
  void persistBooking(booking)
}
