import { getHostProfileDetails } from '../data/mockData'
import type { Booking } from '../types'

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

/** Resolve when a load counts as "hosted today" (acceptance or completion). */
function getLoadActivityDate(load: Booking): Date | null {
  const accepted = parseTimestamp(load.acceptedAt)
  if (accepted) return accepted

  const completed = parseTimestamp(load.completedAt)
  if (completed) return completed

  const created = parseTimestamp(load.createdAt)
  if (created) return created

  const gotBag = parseTimestamp(load.stageTimes?.['got-bag'])
  if (gotBag) return gotBag

  // Legacy bookings only stored display times like "5:04 PM" — treat active loads as today.
  if (load.stage !== 'picked-up') return new Date()

  return null
}

export function getHostLoadsHostedSeedBaseline(hostId: string | undefined): number {
  if (!hostId) return 0
  return getHostProfileDetails(hostId).loadsHosted
}

export function countHostLoadsToday(activeLoads: Booking[], completedLoads: Booking[]): number {
  const ids = new Set<string>()

  for (const load of activeLoads) {
    const date = getLoadActivityDate(load)
    if (date && isToday(date)) ids.add(load.id)
  }

  for (const load of completedLoads) {
    const date = getLoadActivityDate(load)
    if (date && isToday(date)) ids.add(load.id)
  }

  return ids.size
}

/** Lifetime hosted loads: demo seed baseline plus every active or completed booking. */
export function countHostLoadsHosted(
  seedBaseline: number,
  activeLoads: Booking[],
  completedLoads: Booking[],
): number {
  const ids = new Set<string>()

  for (const load of activeLoads) {
    ids.add(load.id)
  }

  for (const load of completedLoads) {
    if (load.stage === 'picked-up' || load.completedAt) {
      ids.add(load.id)
    }
  }

  return seedBaseline + ids.size
}
