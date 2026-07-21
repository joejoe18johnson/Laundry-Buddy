import type { Booking, BookingStage } from '../types'

const PRE_DRYER_STAGES: BookingStage[] = ['got-bag', 'waiting']

export function isPreDryerLoad(load: Booking): boolean {
  return PRE_DRYER_STAGES.includes(load.stage)
}

export function isDryerTabLoad(load: Booking): boolean {
  return load.stage === 'drying' || load.stage === 'ready'
}

export function countDryerTabLoads(loads: Booking[]): number {
  return loads.filter(isDryerTabLoad).length
}

export function splitHostActiveLoads(loads: Booking[]): {
  dashboardLoads: Booking[]
  dryerLoads: Booking[]
  dryingLoads: Booking[]
  readyLoads: Booking[]
} {
  const dashboardLoads = loads.filter(isPreDryerLoad)
  const dryerLoads = loads.filter(isDryerTabLoad)
  const dryingLoads = loads.filter((load) => load.stage === 'drying')
  const readyLoads = loads.filter((load) => load.stage === 'ready')
  return { dashboardLoads, dryerLoads, dryingLoads, readyLoads }
}
