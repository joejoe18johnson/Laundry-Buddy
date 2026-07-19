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

export type HostProgressStep = {
  key: string
  number: number
  label: string
  description: string
  icon: IconName
}

/** Guest journey — one clear step at a time. */
export const GUEST_LOAD_STEPS: GuestProgressStep[] = [
  {
    key: 'request',
    number: 1,
    label: 'Request sent',
    description: 'Your host will accept or decline',
    icon: 'send',
  },
  {
    key: 'payment-sent',
    number: 2,
    label: 'Pay your host',
    description: 'Transfer in the app and submit your receipt',
    icon: 'credit-card',
    stageKey: 'payment-proof',
  },
  {
    key: 'payment-confirmed',
    number: 3,
    label: 'Payment confirmed',
    description: 'Your host verified payment — drying can start',
    icon: 'check-circle',
  },
  {
    key: 'drying',
    number: 4,
    label: 'Drying',
    description: 'Your laundry is in the dryer',
    icon: 'wind',
    stageKey: 'drying',
  },
  {
    key: 'ready',
    number: 5,
    label: 'Ready for pickup',
    description: 'Collect your clean laundry',
    icon: 'package',
    stageKey: 'ready',
  },
  {
    key: 'picked-up',
    number: 6,
    label: 'Picked up',
    description: 'All done — thanks for using Laundry Buddy',
    icon: 'check-circle',
    stageKey: 'picked-up',
  },
]

export const HOST_LOAD_STEPS: HostProgressStep[] = [
  {
    key: 'accept',
    number: 1,
    label: 'Load accepted',
    description: 'Guest can drop off — bank transfer details sent automatically',
    icon: 'check-circle',
  },
  {
    key: 'payment',
    number: 2,
    label: 'Confirm payment',
    description: 'Guest pays in the app — you confirm when proof arrives',
    icon: 'credit-card',
  },
  {
    key: 'dry',
    number: 3,
    label: 'Start drying',
    description: 'Move laundry to the dryer once payment is confirmed',
    icon: 'wind',
  },
  {
    key: 'ready',
    number: 4,
    label: 'Mark dry',
    description: 'Add a photo and notify guest when ready',
    icon: 'package',
  },
  {
    key: 'pickup',
    number: 5,
    label: 'Confirm pickup',
    description: 'Tap when the guest collects their laundry',
    icon: 'check-circle',
  },
]

function needsBankPayment(booking: Booking): boolean {
  return booking.paymentMethod === 'bank_transfer' && (booking.totalAmount ?? 0) > 0
}

function isCashPayment(booking: Booking): boolean {
  return booking.paymentMethod === 'cash' && (booking.totalAmount ?? 0) > 0
}

export function getGuestProgressIndex(booking: Booking): number {
  if (booking.requestStatus === 'pending') return 0
  if (booking.requestStatus === 'declined') return -1
  if (booking.stage === 'picked-up') return GUEST_LOAD_STEPS.length

  const proofSent = !!booking.paymentProofSentAt
  const paid = booking.paymentStatus === 'paid'

  if (needsBankPayment(booking)) {
    if (!booking.paymentRequestedAt || !proofSent) return 1
    if (!paid) return 2
  } else if (isCashPayment(booking)) {
    if (!paid) return 1
  }

  if (booking.stage === 'ready') return 4
  if (booking.stage === 'drying') return 3
  if (needsBankPayment(booking) && paid) return 2
  if (isCashPayment(booking)) return 1

  return 1
}

export function getHostProgressIndex(load: Booking): number {
  if (load.requestStatus !== 'accepted') return 0

  const needsBank = needsBankPayment(load)
  if (needsBank && load.paymentStatus !== 'paid') return 1

  if (load.stage === 'ready') return 4
  if (load.stage === 'drying') return 3
  if (load.stage === 'got-bag' || load.stage === 'waiting') return 2

  return 2
}

export function getGuestProgressStep(booking: Booking): GuestProgressStep {
  const index = Math.max(0, getGuestProgressIndex(booking))
  return GUEST_LOAD_STEPS[Math.min(index, GUEST_LOAD_STEPS.length - 1)]
}

export function getHostProgressStep(load: Booking): HostProgressStep {
  const index = Math.max(0, Math.min(getHostProgressIndex(load), HOST_LOAD_STEPS.length - 1))
  return HOST_LOAD_STEPS[index]
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
      return booking.paymentProofSentAt
        ? formatShortTime(booking.paymentProofSentAt)
        : booking.paymentRequestedAt
          ? formatShortTime(booking.paymentRequestedAt)
          : undefined
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

export function getGuestStepLabel(booking: Booking, step: GuestProgressStep): string {
  if (step.key === 'request') {
    return booking.requestStatus === 'pending' ? 'Request sent' : 'Host accepted'
  }

  if (step.key === 'payment-sent') {
    if (isCashPayment(booking)) return 'Pay at pickup'
    if (!booking.paymentRequestedAt) return 'Waiting for payment details'
    if (!booking.paymentProofSentAt) return 'Pay now'
    return 'Proof sent'
  }

  if (step.key === 'payment-confirmed') {
    if (needsBankPayment(booking) && booking.paymentProofSentAt && booking.paymentStatus !== 'paid') {
      return 'Waiting for confirmation'
    }
    if (isCashPayment(booking) && booking.paymentStatus === 'paid') return 'Pay cash at pickup'
    return step.label
  }

  return step.label
}

export function getGuestStepDescription(booking: Booking, step: GuestProgressStep): string {
  if (step.key === 'request') {
    if (booking.requestStatus === 'pending') {
      return `${booking.hostName} will review your request — you'll get a notification when they respond.`
    }
    return 'Request accepted — drop off your laundry and follow the steps below.'
  }

  if (step.key === 'payment-sent') {
    if (isCashPayment(booking)) {
      return `Bring ${booking.hostName} cash when you drop off or pick up.`
    }
    if (!booking.paymentRequestedAt) {
      return `${booking.hostName} will send bank details automatically after accepting.`
    }
    if (!booking.paymentProofSentAt) {
      return 'Use the Pay now section above — transfer, attach your receipt, and submit proof.'
    }
    return `${booking.hostName} is reviewing your receipt — hang tight.`
  }

  if (step.key === 'payment-confirmed') {
    if (needsBankPayment(booking) && booking.paymentProofSentAt && booking.paymentStatus !== 'paid') {
      return 'Your proof was sent — drying starts after your host confirms payment.'
    }
  }

  return step.description
}

export function getHostStepLabel(load: Booking, step: HostProgressStep): string {
  if (step.key === 'payment' && needsBankPayment(load)) {
    if (!load.paymentProofSentAt) return 'Waiting for guest payment'
    if (load.paymentStatus !== 'paid') return 'Confirm payment'
  }
  if (step.key === 'payment' && isCashPayment(load)) return 'Cash at pickup'
  return step.label
}

export function getHostStepDescription(load: Booking, step: HostProgressStep): string {
  if (step.key === 'payment' && needsBankPayment(load)) {
    if (!load.paymentProofSentAt) {
      return 'Guest pays on My loads — you will see proof here when they submit it.'
    }
    if (load.paymentStatus !== 'paid') {
      return 'Review the transfer screenshot, then tap Confirm payment.'
    }
  }
  if (step.key === 'payment' && isCashPayment(load)) {
    return 'No transfer needed — collect cash when the guest picks up.'
  }
  return step.description
}

export function getProgressPercent(activeIndex: number, totalSteps: number): number {
  if (totalSteps <= 1) return 0
  const clamped = Math.min(activeIndex, totalSteps - 1)
  return Math.round((clamped / (totalSteps - 1)) * 100)
}
