import type { Booking, BookingStage } from '../types'
import { isPickupComplete } from './pickupConfirmation'

/** Payment / drop-off — before the dryer cycle starts. */
export function isPreDryerLoad(load: Booking): boolean {
  return load.stage === 'got-bag' || load.stage === 'waiting'
}

/** Any in-progress host load belongs on the Dryer tab (not the dashboard). */
export function isDryerTabLoad(load: Booking): boolean {
  return load.stage !== 'picked-up' && !isPickupComplete(load)
}

export function countDryerTabLoads(loads: Booking[]): number {
  return loads.filter(isDryerTabLoad).length
}

export function hasOpenHostLoad(loads: Booking[]): boolean {
  return loads.some(isDryerTabLoad)
}

export function splitHostActiveLoads(loads: Booking[]): {
  preDryerLoads: Booking[]
  dryerLoads: Booking[]
  dryingLoads: Booking[]
  readyLoads: Booking[]
} {
  const preDryerLoads = loads.filter(isPreDryerLoad)
  const dryingLoads = loads.filter((load) => load.stage === 'drying')
  const readyLoads = loads.filter((load) => load.stage === 'ready')
  const dryerLoads = loads.filter(isDryerTabLoad)
  return { preDryerLoads, dryerLoads, dryingLoads, readyLoads }
}

export function stageBadge(stage: BookingStage) {
  switch (stage) {
    case 'ready':
      return { label: 'Ready', variant: 'ready' as const }
    case 'drying':
      return { label: 'Drying', variant: 'drying' as const }
    case 'waiting':
      return { label: 'Waiting', variant: 'awaiting' as const }
    default:
      return { label: 'Received', variant: 'neutral' as const }
  }
}
