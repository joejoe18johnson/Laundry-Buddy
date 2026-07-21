import type { IconName } from '../components/AppIcon'
import { formatMoney } from './bookingPayments'
import type { Booking, BookingStage } from '../types'

export type BookingStepEventKind =
  | 'request-accepted'
  | 'payment-requested'
  | 'payment-proof-sent'
  | 'payment-confirmed'
  | 'drying-started'
  | 'ready-for-pickup'
  | 'picked-up'
  | 'request-declined'

export type BookingStepSnapshot = {
  id: string
  hostId: string
  hostName: string
  customerName: string
  requestStatus?: Booking['requestStatus']
  paymentStatus?: Booking['paymentStatus']
  paymentMethod?: Booking['paymentMethod']
  paymentRequestedAt?: string
  paymentProofSentAt?: string
  stage: BookingStage
  totalAmount?: number
}

export type BookingStepEvent = {
  id: string
  bookingId: string
  hostId: string
  kind: BookingStepEventKind
  kicker: string
  title: string
  body: string
  icon: IconName
  primaryLabel: string
}

export function toBookingStepSnapshot(booking: Booking): BookingStepSnapshot {
  return {
    id: booking.id,
    hostId: booking.hostId,
    hostName: booking.hostName,
    customerName: booking.customerName,
    requestStatus: booking.requestStatus,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    paymentRequestedAt: booking.paymentRequestedAt,
    paymentProofSentAt: booking.paymentProofSentAt,
    stage: booking.stage,
    totalAmount: booking.totalAmount,
  }
}

function eventId(bookingId: string, kind: BookingStepEventKind) {
  return `${bookingId}:${kind}`
}

function needsPayment(booking: BookingStepSnapshot): boolean {
  return (booking.totalAmount ?? 0) > 0
}

function buildGuestEvent(
  snapshot: BookingStepSnapshot,
  kind: BookingStepEventKind,
): BookingStepEvent {
  const amount = formatMoney(snapshot.totalAmount ?? 0)
  const host = snapshot.hostName

  switch (kind) {
    case 'request-accepted': {
      const isBank = snapshot.paymentMethod === 'bank_transfer' && needsPayment(snapshot)
      const isCash = snapshot.paymentMethod === 'cash' && needsPayment(snapshot)
      return {
        id: eventId(snapshot.id, kind),
        bookingId: snapshot.id,
        hostId: snapshot.hostId,
        kind,
        kicker: 'Load accepted',
        title: `${host} accepted your request`,
        body: isBank
          ? `Transfer ${amount} in the app so drying can start after ${host} verifies payment.`
          : isCash
            ? `${host} accepted your load. Pay ${amount} in cash at drop-off — directions are in the app.`
            : `${host} accepted your load! Open tracking for drop-off directions and gate details.`,
        icon: 'check-circle',
        primaryLabel: 'View load',
      }
    }
    case 'payment-requested':
      return {
        id: eventId(snapshot.id, kind),
        bookingId: snapshot.id,
        hostId: snapshot.hostId,
        kind,
        kicker: 'Pay your host',
        title: `Transfer ${amount} to ${host}`,
        body: 'Bank details are ready in the app — attach your receipt after you pay.',
        icon: 'credit-card',
        primaryLabel: 'Pay now',
      }
    case 'payment-confirmed': {
      const isCash = snapshot.paymentMethod === 'cash'
      return {
        id: eventId(snapshot.id, kind),
        bookingId: snapshot.id,
        hostId: snapshot.hostId,
        kind,
        kicker: 'Payment confirmed',
        title: isCash ? 'Cash payment confirmed' : 'Payment verified',
        body: isCash
          ? `${host} confirmed your ${amount} cash payment at drop-off.`
          : `${host} confirmed your ${amount} bank transfer — drying can start soon.`,
        icon: 'check-circle',
        primaryLabel: 'View load',
      }
    }
    case 'drying-started':
      return {
        id: eventId(snapshot.id, kind),
        bookingId: snapshot.id,
        hostId: snapshot.hostId,
        kind,
        kicker: 'In the dryer',
        title: 'Drying started',
        body: `${host} moved your laundry to the dryer. We'll notify you when it's ready.`,
        icon: 'wind',
        primaryLabel: 'View load',
      }
    case 'ready-for-pickup':
      return {
        id: eventId(snapshot.id, kind),
        bookingId: snapshot.id,
        hostId: snapshot.hostId,
        kind,
        kicker: 'Ready for pickup',
        title: 'Your laundry is dry',
        body: `${host} marked your load ready — collect it when you can.`,
        icon: 'package',
        primaryLabel: 'View load',
      }
    case 'picked-up':
      return {
        id: eventId(snapshot.id, kind),
        bookingId: snapshot.id,
        hostId: snapshot.hostId,
        kind,
        kicker: 'All done',
        title: 'Load complete',
        body: `Thanks for using Laundry Buddy! Leave a review for ${host} to help others find great hosts.`,
        icon: 'star',
        primaryLabel: 'Leave review',
      }
    case 'request-declined':
      return {
        id: eventId(snapshot.id, kind),
        bookingId: snapshot.id,
        hostId: snapshot.hostId,
        kind,
        kicker: 'Request update',
        title: 'Request declined',
        body: `${host} could not take your load this time. Browse other nearby hosts.`,
        icon: 'x-circle',
        primaryLabel: 'Browse hosts',
      }
    default:
      return buildGuestEvent(snapshot, 'request-accepted')
  }
}

function buildHostEvent(
  snapshot: BookingStepSnapshot,
  kind: BookingStepEventKind,
): BookingStepEvent {
  const guest = snapshot.customerName
  const amount = formatMoney(snapshot.totalAmount ?? 0)

  switch (kind) {
    case 'payment-proof-sent':
      return {
        id: eventId(snapshot.id, kind),
        bookingId: snapshot.id,
        hostId: snapshot.hostId,
        kind,
        kicker: 'Payment proof',
        title: `${guest} submitted payment proof`,
        body: `Review the ${amount} transfer screenshot, then confirm payment on your dashboard.`,
        icon: 'credit-card',
        primaryLabel: 'Review payment',
      }
    case 'picked-up':
      return {
        id: eventId(snapshot.id, kind),
        bookingId: snapshot.id,
        hostId: snapshot.hostId,
        kind,
        kicker: 'Load complete',
        title: `${guest} picked up`,
        body: 'The load is done — ask your guest for a review to get more bookings.',
        icon: 'check-circle',
        primaryLabel: 'Go to dashboard',
      }
    default:
      return buildHostEvent(snapshot, 'payment-proof-sent')
  }
}

function detectGuestTransitions(
  prev: BookingStepSnapshot | undefined,
  next: BookingStepSnapshot,
): BookingStepEventKind[] {
  if (!prev) return []

  const kinds: BookingStepEventKind[] = []

  if (prev.requestStatus === 'pending' && next.requestStatus === 'accepted') {
    kinds.push('request-accepted')
  } else if (prev.requestStatus !== 'declined' && next.requestStatus === 'declined') {
    kinds.push('request-declined')
  }

  if (
    !prev.paymentRequestedAt &&
    next.paymentRequestedAt &&
    next.requestStatus === 'accepted' &&
    prev.requestStatus === 'accepted'
  ) {
    kinds.push('payment-requested')
  }

  if (prev.paymentStatus !== 'paid' && next.paymentStatus === 'paid') {
    kinds.push('payment-confirmed')
  }

  if (prev.stage !== 'drying' && next.stage === 'drying') {
    kinds.push('drying-started')
  }

  if (prev.stage !== 'ready' && next.stage === 'ready') {
    kinds.push('ready-for-pickup')
  }

  return kinds
}

function detectHostTransitions(
  prev: BookingStepSnapshot | undefined,
  next: BookingStepSnapshot,
): BookingStepEventKind[] {
  if (!prev) return []

  const kinds: BookingStepEventKind[] = []

  if (!prev.paymentProofSentAt && next.paymentProofSentAt) {
    kinds.push('payment-proof-sent')
  }

  return kinds
}

function wasActiveGuestSnapshot(snapshot: BookingStepSnapshot): boolean {
  return snapshot.requestStatus !== 'declined' && snapshot.stage !== 'picked-up'
}

function wasActiveHostSnapshot(snapshot: BookingStepSnapshot): boolean {
  return snapshot.requestStatus === 'accepted' && snapshot.stage !== 'picked-up'
}

export function detectGuestStepEvents(
  previous: Map<string, BookingStepSnapshot>,
  bookings: Booking[],
): BookingStepEvent[] {
  const events: BookingStepEvent[] = []
  const currentIds = new Set(bookings.map((booking) => booking.id))

  for (const booking of bookings) {
    const next = toBookingStepSnapshot(booking)
    const prev = previous.get(booking.id)
    for (const kind of detectGuestTransitions(prev, next)) {
      events.push(buildGuestEvent(next, kind))
    }
  }

  for (const [id, prev] of previous.entries()) {
    if (currentIds.has(id) || !wasActiveGuestSnapshot(prev)) continue
    events.push(buildGuestEvent(prev, 'picked-up'))
  }

  return events
}

export function detectHostStepEvents(
  previous: Map<string, BookingStepSnapshot>,
  loads: Booking[],
): BookingStepEvent[] {
  const events: BookingStepEvent[] = []
  const currentIds = new Set(loads.map((load) => load.id))

  for (const load of loads) {
    const next = toBookingStepSnapshot(load)
    const prev = previous.get(load.id)
    for (const kind of detectHostTransitions(prev, next)) {
      events.push(buildHostEvent(next, kind))
    }
  }

  for (const [id, prev] of previous.entries()) {
    if (currentIds.has(id) || !wasActiveHostSnapshot(prev)) continue
    events.push(buildHostEvent(prev, 'picked-up'))
  }

  return events
}
