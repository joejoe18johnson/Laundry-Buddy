import type { Booking } from '../types'
import { getBookingAmount, sumBookingAmounts } from './bookingPayments'
import { getLoadActivityDate } from './hostLoadStats'

export interface HostBusinessStats {
  totalEarned: number
  earnedToday: number
  completedLoads: number
  paidLoads: number
  loadsHosted: number
  loadsToday: number
}

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function isToday(date: Date): boolean {
  return startOfLocalDay(date) === startOfLocalDay(new Date())
}

function isCompletedLoad(load: Booking): boolean {
  return load.stage === 'picked-up' || !!load.completedAt
}

function mergeHostLoads(activeLoads: Booking[], completedLoads: Booking[]): Booking[] {
  const byId = new Map<string, Booking>()
  for (const load of activeLoads) byId.set(load.id, load)
  for (const load of completedLoads) byId.set(load.id, load)
  return Array.from(byId.values())
}

function isTodayLoad(load: Booking): boolean {
  const date = getLoadActivityDate(load)
  return date != null && isToday(date)
}

/** Revenue counts once payment is confirmed or the load is finished. */
function countsAsEarned(load: Booking): boolean {
  if (load.paymentStatus === 'paid') return true
  const amount = getBookingAmount(load)
  if (amount <= 0 && isCompletedLoad(load)) return true
  return isCompletedLoad(load)
}

export function computeHostBusinessStats(
  activeLoads: Booking[],
  completedLoads: Booking[],
  loadsHosted: number,
  loadsToday: number,
): HostBusinessStats {
  const finished = completedLoads.filter(isCompletedLoad)
  const paidLoads = finished.filter((load) => load.paymentStatus !== 'pending').length

  const earnedToday = mergeHostLoads(activeLoads, completedLoads)
    .filter(isTodayLoad)
    .filter(countsAsEarned)
    .reduce((sum, load) => sum + getBookingAmount(load), 0)

  return {
    totalEarned: sumBookingAmounts(finished),
    earnedToday,
    completedLoads: finished.length,
    paidLoads,
    loadsHosted,
    loadsToday,
  }
}
