import AsyncStorage from '@react-native-async-storage/async-storage'
import { SEED_CUSTOMER_HISTORY, SEED_HOST_HISTORY } from '../data/seedData'
import type { Booking } from '../types'

const CUSTOMER_KEY = 'laundry-buddy-customer-payments'
const HOST_KEY = 'laundry-buddy-host-payments'

async function readMap(key: string): Promise<Record<string, Booking[]>> {
  const raw = await AsyncStorage.getItem(key)
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, Booking[]>
}

async function writeMap(key: string, map: Record<string, Booking[]>) {
  await AsyncStorage.setItem(key, JSON.stringify(map))
}

function mergeBookings(seed: Booking[], stored: Booking[]): Booking[] {
  const byId = new Map<string, Booking>()
  for (const booking of seed) byId.set(booking.id, booking)
  for (const booking of stored) byId.set(booking.id, booking)
  return [...byId.values()]
}

export async function loadCustomerPaymentHistory(userId: string): Promise<Booking[]> {
  const seed = SEED_CUSTOMER_HISTORY[userId] ?? []
  const map = await readMap(CUSTOMER_KEY)
  return mergeBookings(seed, map[userId] ?? [])
}

export async function loadHostPaymentHistory(userId: string): Promise<Booking[]> {
  const seed = SEED_HOST_HISTORY[userId] ?? []
  const map = await readMap(HOST_KEY)
  return mergeBookings(seed, map[userId] ?? [])
}

export async function saveCompletedCustomerPayment(userId: string, booking: Booking) {
  const map = await readMap(CUSTOMER_KEY)
  const list = map[userId] ?? []
  if (list.some((b) => b.id === booking.id)) return
  map[userId] = [{ ...booking, stage: 'ready' }, ...list]
  await writeMap(CUSTOMER_KEY, map)
}

export async function saveCompletedHostPayment(userId: string, booking: Booking) {
  const map = await readMap(HOST_KEY)
  const list = map[userId] ?? []
  if (list.some((b) => b.id === booking.id)) return
  map[userId] = [{ ...booking, stage: 'ready' }, ...list]
  await writeMap(HOST_KEY, map)
}
