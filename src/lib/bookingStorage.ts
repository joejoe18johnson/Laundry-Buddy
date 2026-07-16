import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Booking } from '../types'

const KEY = 'laundry-buddy-active-booking'

export async function loadActiveBooking(userId: string): Promise<Booking | null> {
  const raw = await AsyncStorage.getItem(KEY)
  if (!raw) return null
  const map = JSON.parse(raw) as Record<string, Booking | null>
  return map[userId] ?? null
}

export async function saveActiveBooking(userId: string, booking: Booking | null): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY)
  const map = raw ? (JSON.parse(raw) as Record<string, Booking | null>) : {}
  map[userId] = booking
  await AsyncStorage.setItem(KEY, JSON.stringify(map))
}
