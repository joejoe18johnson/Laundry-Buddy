import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Booking, HostRequest } from '../types'

const ORDERS_KEY = 'laundry-buddy-host-orders'

export interface HostOrders {
  pendingRequests: HostRequest[]
  activeLoads: Booking[]
}

const EMPTY_ORDERS: HostOrders = { pendingRequests: [], activeLoads: [] }

export async function getHostOrders(hostUserId: string): Promise<HostOrders> {
  const raw = await AsyncStorage.getItem(ORDERS_KEY)
  if (!raw) return { ...EMPTY_ORDERS }
  const all = JSON.parse(raw) as Record<string, HostOrders>
  return all[hostUserId] ?? { ...EMPTY_ORDERS }
}

export async function saveHostOrders(hostUserId: string, orders: HostOrders): Promise<void> {
  const raw = await AsyncStorage.getItem(ORDERS_KEY)
  const all = raw ? (JSON.parse(raw) as Record<string, HostOrders>) : {}
  all[hostUserId] = orders
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(all))
}

export async function appendHostRequest(hostUserId: string, request: HostRequest): Promise<void> {
  const orders = await getHostOrders(hostUserId)
  if (orders.pendingRequests.some((r) => r.id === request.id)) return
  orders.pendingRequests = [request, ...orders.pendingRequests]
  await saveHostOrders(hostUserId, orders)
}

export function mergeHostRequests(
  seed: HostRequest[],
  stored: HostRequest[],
  activeLoadIds: Iterable<string> = [],
): HostRequest[] {
  const accepted = new Set(activeLoadIds)
  const byId = new Map<string, HostRequest>()
  for (const r of [...seed, ...stored]) {
    if (r.status === 'pending' && !accepted.has(r.id)) byId.set(r.id, r)
  }
  return [...byId.values()]
}

export function upsertActiveLoad(loads: Booking[], load: Booking): Booking[] {
  const index = loads.findIndex((entry) => entry.id === load.id)
  if (index === -1) return [...loads, load]
  const next = [...loads]
  next[index] = load
  return next
}

export function dedupeActiveLoads(loads: Booking[]): Booking[] {
  const byId = new Map<string, Booking>()
  for (const load of loads) {
    byId.set(load.id, load)
  }
  return [...byId.values()]
}

export async function removeHostActiveLoad(hostUserId: string, loadId: string): Promise<void> {
  const orders = await getHostOrders(hostUserId)
  await saveHostOrders(hostUserId, {
    ...orders,
    activeLoads: orders.activeLoads.filter((load) => load.id !== loadId),
  })
}

export async function removeHostPendingRequest(hostUserId: string, requestId: string): Promise<void> {
  const orders = await getHostOrders(hostUserId)
  await saveHostOrders(hostUserId, {
    ...orders,
    pendingRequests: orders.pendingRequests.filter((request) => request.id !== requestId),
  })
}

export async function updateHostActiveLoads(
  hostUserId: string,
  activeLoads: Booking[],
): Promise<void> {
  const orders = await getHostOrders(hostUserId)
  await saveHostOrders(hostUserId, { ...orders, activeLoads })
}

export function mergeActiveLoads(seed: Booking[], stored: Booking[]): Booking[] {
  const byId = new Map<string, Booking>()
  for (const load of [...seed, ...stored]) {
    byId.set(load.id, load)
  }
  return [...byId.values()]
}
