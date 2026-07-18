import type { IconName } from '../components/AppIcon'
import type { Booking, BookingStage } from '../types'

export type GuestProgressStep = {
  key: string
  number: number
  label: string
  description: string
  icon: IconName
  stageKey?: BookingStage | 'payment-proof'
}

/** Guest-facing load journey — 6 steps from request through pickup. */
export const GUEST_LOAD_STEPS: GuestProgressStep[] = [
  {
    key: 'request',
    number: 1,
    label: 'Request & Accept',
    description: 'Request sent — waiting for your host to accept',
    icon: 'send',
  },
  {
    key: 'payment-sent',
    number: 2,
    label: 'Payment Sent',
    description: 'Send your bank transfer proof in chat',
    icon: 'credit-card',
    stageKey: 'payment-proof',
  },
  {
    key: 'payment-confirmed',
    number: 3,
    label: 'Payment Confirmed',
    description: 'Host verified your payment',
    icon: 'check-circle',
  },
  {
    key: 'drying',
    number: 4,
    label: 'Drying Started',
    description: 'Your laundry is in the dryer',
    icon: 'wind',
    stageKey: 'drying',
  },
  {
    key: 'ready',
    number: 5,
    label: 'Ready For Pickup',
    description: 'Pick up your clean laundry anytime',
    icon: 'package',
    stageKey: 'ready',
  },
  {
    key: 'picked-up',
    number: 6,
    label: 'Picked Up',
    description: 'Load complete — thanks for using Laundry Buddy',
    icon: 'check-circle',
    stageKey: 'picked-up',
  },
]

function needsBankPayment(booking: Booking): boolean {
  return booking.paymentMethod === 'bank_transfer' && (booking.totalAmount ?? 0) > 0
}

export function getGuestProgressIndex(booking: Booking): number {
  if (booking.requestStatus === 'pending') return 0
  if (booking.requestStatus === 'declined') return -1
  if (booking.stage === 'picked-up') return GUEST_LOAD_STEPS.length

  const proofSent = !!booking.paymentProofSentAt
  const paid = booking.paymentStatus === 'paid'

  if (needsBankPayment(booking)) {
    if (!proofSent) return 1
    if (!paid) return 2
  } else if (!paid && (booking.totalAmount ?? 0) > 0) {
    return 1
  }

  if (booking.stage === 'ready') return 4
  if (booking.stage === 'drying') return 3
  return 2
}

export function getGuestProgressStep(booking: Booking): GuestProgressStep {
  const index = Math.max(0, getGuestProgressIndex(booking))
  return GUEST_LOAD_STEPS[Math.min(index, GUEST_LOAD_STEPS.length - 1)]
}

function formatShortTime(iso: string) {
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return undefined
  return new Date(parsed).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function getStepTimestamp(booking: Booking, step: GuestProgressStep): string | undefined {
  const activeIndex = getGuestProgressIndex(booking)
  const stepIndex = GUEST_LOAD_STEPS.findIndex((entry) => entry.key === step.key)
  if (stepIndex < 0 || stepIndex > activeIndex) return undefined

  switch (step.key) {
    case 'request':
      return booking.acceptedAt ?? (booking.createdAt ? formatShortTime(booking.createdAt) : undefined)
    case 'payment-sent':
      return booking.paymentProofSentAt ? formatShortTime(booking.paymentProofSentAt) : undefined
    case 'payment-confirmed':
      return booking.paymentStatus === 'paid' ? booking.stageTimes.drying ?? booking.acceptedAt : undefined
    case 'drying':
      return booking.stageTimes.drying
    case 'ready':
      return booking.stageTimes.ready
    case 'picked-up':
      return booking.completedAt
    default:
      return undefined
  }
}

export function getProgressPercent(activeIndex: number, totalSteps: number): number {
  if (totalSteps <= 1) return 0
  const clamped = Math.min(activeIndex, totalSteps - 1)
  return Math.round((clamped / (totalSteps - 1)) * 100)
}
