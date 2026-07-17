import type { Booking } from '../types'
import { calculateBookingTotal, DRYER_SHEET_UNIT_PRICE, sheetsPurchaseTotalPerLoad, type BookingPriceInput } from './hostPricing'

export function formatMoney(amount: number): string {
  return amount <= 0 ? 'Free' : `$${amount}`
}

export function getBookingPriceInput(booking: Booking): BookingPriceInput {
  return {
    loads: booking.loads,
    dryPrice: booking.dryPrice ?? booking.pricePerLoad ?? 0,
    foldingPrice: booking.foldingPrice ?? 0,
    sheetsPrice: booking.sheetsPrice ?? DRYER_SHEET_UNIT_PRICE,
    sheetsOption: booking.sheetsOption,
    foldingService: booking.foldingService ?? false,
  }
}

export function getBookingAmount(booking: Booking): number {
  if (booking.totalAmount != null) return booking.totalAmount
  return calculateBookingTotal(getBookingPriceInput(booking))
}

export function formatPaymentMethod(method?: Booking['paymentMethod']): string {
  if (!method) return '—'
  return method === 'cash' ? 'Cash' : 'Bank Transfer'
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
