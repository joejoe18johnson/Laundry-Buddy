import type { Booking } from '../types'
import { getBookingAmount, sumBookingAmounts } from './bookingPayments'

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

function parseTimestamp(value: string | undefined): Date | null {
  if (!value) return null
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return null
  return new Date(parsed)
}

function getCompletedDate(load: Booking): Date | null {
  return (
    parseTimestamp(load.completedAt) ??
    parseTimestamp(load.stageTimes?.['picked-up']) ??
    parseTimestamp(load.acceptedAt)
  )
}

function isCompletedLoad(load: Booking): boolean {
  return load.stage === 'picked-up' || !!load.completedAt
}

export function computeHostBusinessStats(
  completedLoads: Booking[],
  loadsHosted: number,
  loadsToday: number,
): HostBusinessStats {
  const finished = completedLoads.filter(isCompletedLoad)
  const paidLoads = finished.filter((load) => load.paymentStatus !== 'pending').length
  const earnedToday = finished
    .filter((load) => {
      const date = getCompletedDate(load)
      return date != null && isToday(date)
    })
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
