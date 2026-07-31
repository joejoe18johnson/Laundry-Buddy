import type { Booking } from '../../types'
import { isPickupComplete } from '../pickupConfirmation'
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

export async function upsertBookingToSupabase(booking: Booking): Promise<Booking | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const payload = bookingToInsert(booking)
  const { data, error } = await supabase
    .from('bookings')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Could not save booking.')
  }

  return bookingRowToBooking(data)
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
