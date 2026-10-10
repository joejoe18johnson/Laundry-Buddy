import type { Booking } from '../types'
import {
  buildBookingPriceInputFromBooking,
  calculateBookingTotal,
  laundryServiceLabel,
  resolveLaundryServiceMode,
} from './hostPricing'

export function formatMoney(amount: number): string {
  return amount <= 0 ? 'Free' : `$${amount}`
}

/** Always shows a dollar amount — use for earnings/spending totals, not guest-facing prices. */
export function formatCurrency(amount: number): string {
  if (amount <= 0) return '$0'
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`
}

export function getBookingPriceInput(booking: Booking) {
  return buildBookingPriceInputFromBooking(booking)
}

export function getBookingAmount(booking: Booking): number {
  if (booking.totalAmount != null) return booking.totalAmount
  return calculateBookingTotal(getBookingPriceInput(booking))
}

export const CASH_PAY_AT_DROP_OFF = 'Pay at drop-off'

export function formatPaymentMethod(method?: Booking['paymentMethod']): string {
  if (!method) return '—'
  return method === 'cash' ? `Cash · ${CASH_PAY_AT_DROP_OFF}` : 'Bank Transfer'
}

export function cashPaymentGuestHint(hostName: string): string {
  return `Pay ${hostName} in cash when you drop off your laundry.`
}

export function cashPaymentHostHint(): string {
  return 'Collect cash when the guest drops off, then confirm payment before drying.'
}

export function sumBookingAmounts(bookings: Booking[]): number {
  return bookings.reduce((sum, b) => sum + getBookingAmount(b), 0)
}

export function bookingExtrasSummary(booking: Booking): string | null {
  const mode = resolveLaundryServiceMode(booking)
  const parts: string[] = [laundryServiceLabel(mode)]
  if (booking.detergentOption === 'buy') parts.push('Detergent')
  if ((booking.dryerSheetsPacks ?? 0) > 0) parts.push('Dryer sheets')
  if (booking.foldingService) parts.push('Folding')
  return parts.length > 0 ? parts.join(' · ') : null
}

// Re-export for convenience
export { calculateBookingTotal, bookingTotalLabel } from './hostPricing'
