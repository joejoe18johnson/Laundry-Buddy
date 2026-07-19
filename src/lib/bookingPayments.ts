import type { Booking } from '../types'
import { calculateBookingTotal, DRYER_SHEETS_PRICE, type BookingPriceInput } from './hostPricing'

export function formatMoney(amount: number): string {
  return amount <= 0 ? 'Free' : `$${amount}`
}

export function getBookingPriceInput(booking: Booking): BookingPriceInput {
  return {
    loads: booking.loads,
    dryPrice: booking.dryPrice ?? booking.pricePerLoad ?? 0,
    foldingPrice: booking.foldingPrice ?? 0,
    sheetsPrice: booking.sheetsPrice ?? DRYER_SHEETS_PRICE,
    sheetsOption: booking.sheetsOption,
    foldingService: booking.foldingService ?? false,
  }
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
  const parts: string[] = []
  if (booking.foldingService) parts.push('Folding')
  if (booking.sheetsOption === 'buy') parts.push('Sheets from host')
  if (booking.sheetsOption === 'none') parts.push('No sheets')
  return parts.length > 0 ? parts.join(' · ') : null
}

// Re-export for convenience
export { calculateBookingTotal, bookingTotalLabel } from './hostPricing'
