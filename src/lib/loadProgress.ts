import type { IconName } from '../components/AppIcon'
import type { Booking, BookingStage } from '../types'

export type GuestProgressStep = {
  key: string
  number: number
  label: string
  description: string
  icon: IconName
  stageKey?: BookingStage
}

/** Guest-facing load journey from request through pickup. */
export const GUEST_LOAD_STEPS: GuestProgressStep[] = [
  {
    key: 'request',
    number: 1,
    label: 'Request Sent',
    description: 'Your host is reviewing the request',
    icon: 'send',
  },
  {
    key: 'accepted',
    number: 2,
    label: 'Host Accepted',
    description: 'Drop off your laundry at the address below',
    icon: 'check-circle',
  },
  {
    key: 'got-bag',
    number: 3,
    label: 'Bag Received',
    description: 'Host has your laundry',
    icon: 'shopping-bag',
    stageKey: 'got-bag',
  },
  {
    key: 'waiting',
    number: 4,
    label: 'In Queue',
    description: 'Waiting for an open dryer',
    icon: 'clock',
    stageKey: 'waiting',
  },
  {
    key: 'drying',
    number: 5,
    label: 'Drying',
    description: 'Your load is in the dryer',
    icon: 'wind',
    stageKey: 'drying',
  },
  {
    key: 'ready',
    number: 6,
    label: 'Ready For Pickup',
    description: 'Pick up your clean laundry anytime',
    icon: 'package',
    stageKey: 'ready',
  },
]

const STAGE_ACTIVE_INDEX: Record<BookingStage, number> = {
  'got-bag': 1,
  waiting: 3,
  drying: 4,
  ready: 5,
  'picked-up': 6,
}

export function getGuestProgressIndex(booking: Booking): number {
  if (booking.requestStatus === 'pending') return 0
  if (booking.requestStatus === 'declined') return -1
  return STAGE_ACTIVE_INDEX[booking.stage] ?? 1
}

export function getGuestProgressStep(booking: Booking): GuestProgressStep {
  const index = Math.max(0, getGuestProgressIndex(booking))
  return GUEST_LOAD_STEPS[Math.min(index, GUEST_LOAD_STEPS.length - 1)]
}

export function getStepTimestamp(booking: Booking, step: GuestProgressStep): string | undefined {
  const activeIndex = getGuestProgressIndex(booking)
  const stepIndex = GUEST_LOAD_STEPS.findIndex((entry) => entry.key === step.key)
  if (stepIndex < 0 || stepIndex > activeIndex) return undefined

  if (step.key === 'request') return undefined
  if (step.key === 'accepted') return booking.stageTimes['got-bag']
  if (step.stageKey) return booking.stageTimes[step.stageKey]
  return undefined
}

export function getProgressPercent(activeIndex: number, totalSteps: number): number {
  if (totalSteps <= 1) return 0
  const clamped = Math.min(activeIndex, totalSteps - 1)
  return Math.round((clamped / (totalSteps - 1)) * 100)
}
