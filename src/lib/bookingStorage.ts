import AsyncStorage from '@react-native-async-storage/async-storage'
import { filterActiveGuestBookings } from './guestBookings'
import type { Booking } from '../types'

const KEY = 'laundry-buddy-active-bookings'
const LEGACY_KEY = 'laundry-buddy-active-booking'

export async function loadActiveBookings(userId: string): Promise<Booking[]> {
  const raw = await AsyncStorage.getItem(KEY)
  if (raw) {
    const map = JSON.parse(raw) as Record<string, Booking[]>
    return filterActiveGuestBookings(map[userId] ?? [])
  }

  const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY)
  if (!legacyRaw) return []

  const legacyMap = JSON.parse(legacyRaw) as Record<string, Booking | null>
  const legacyBooking = legacyMap[userId]
  if (!legacyBooking) return []

  const migrated = filterActiveGuestBookings([legacyBooking])
  if (migrated.length > 0) {
    await saveActiveBookings(userId, migrated)
  }
  return migrated
}

export async function saveActiveBookings(userId: string, bookings: Booking[]): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY)
  const map = raw ? (JSON.parse(raw) as Record<string, Booking[]>) : {}
  map[userId] = filterActiveGuestBookings(bookings)
  await AsyncStorage.setItem(KEY, JSON.stringify(map))
}

/** @deprecated Use loadActiveBookings — returns the first active booking, if any. */
export async function loadActiveBooking(userId: string): Promise<Booking | null> {
  const bookings = await loadActiveBookings(userId)
  return bookings[0] ?? null
}

/** @deprecated Use saveActiveBookings */
export async function saveActiveBooking(userId: string, booking: Booking | null): Promise<void> {
  await saveActiveBookings(userId, booking ? [booking] : [])
}
