import type { Booking } from '../../types'
import { isPickupComplete, normalizePickupStage } from '../pickupConfirmation'
import { mergeBookingSnapshot } from '../bookingSyncStorage'
import { getSupabaseClient } from './client'
import { bookingRowToBooking, bookingToInsert } from './bookingMappers'

export async function fetchParticipantBookingsFromSupabase(): Promise<Booking[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(bookingRowToBooking)
}

export async function fetchBookingByIdFromSupabase(bookingId: string): Promise<Booking | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle()
  if (error || !data) return null
  return bookingRowToBooking(data)
}

/**
 * Save booking to Supabase. Uses UPDATE first so host changes work — plain upsert fails
 * host updates because INSERT RLS only allows the guest (customer_id = auth.uid()).
 */
export async function upsertBookingToSupabase(booking: Booking): Promise<Booking | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const existing = await fetchBookingByIdFromSupabase(booking.id)
  const merged = normalizePickupStage(
    existing ? mergeBookingSnapshot(existing, booking) : booking,
  )
  const payload = bookingToInsert(merged)

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update(payload)
    .eq('id', booking.id)
    .select('*')

  if (updateError) {
    throw new Error(updateError.message)
  }

  if (updated && updated.length > 0) {
    return bookingRowToBooking(updated[0])
  }

  const { data: inserted, error: insertError } = await supabase
    .from('bookings')
    .insert(payload)
    .select('*')
    .single()

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? 'Could not save booking.')
  }

  return bookingRowToBooking(inserted)
}

export async function deleteBookingFromSupabase(bookingId: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  await supabase.from('bookings').delete().eq('id', bookingId)
}

export function subscribeToBookingChanges(onChange: () => void): () => void {
  const supabase = getSupabaseClient()
  if (!supabase) return () => {}

  const channel = supabase
    .channel('bookings-participant')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      () => {
        onChange()
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function filterVisibleGuestBookings(bookings: Booking[]): Booking[] {
  return bookings.filter(
    (booking) =>
      booking.requestStatus !== 'declined' &&
      (booking.stage !== 'picked-up' || !isPickupComplete(booking)),
  )
}
