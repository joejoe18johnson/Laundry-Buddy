import type { Host, HostPricing, HostSettings, SheetsOption } from '../types'

export const DEFAULT_HOST_PRICING: HostPricing = {
  dryPrice: 3,
  foldingPrice: 0,
  sheetsPrice: 1,
}

export function getHostPricing(host: Host, settings?: HostSettings): HostPricing {
  if (settings?.pricing) return settings.pricing
  return {
    dryPrice: host.price,
    foldingPrice: host.foldingPrice ?? 0,
    sheetsPrice: host.sheetsPrice ?? 1,
  }
}

export function applyHostPricing(host: Host, settings?: HostSettings): Host {
  const pricing = getHostPricing(host, settings)
  return {
    ...host,
    price: pricing.dryPrice,
    foldingPrice: pricing.foldingPrice,
    sheetsPrice: pricing.sheetsPrice,
  }
}

export function offersFoldingService(pricing: HostPricing): boolean {
  return pricing.foldingPrice > 0
}

export function formatServicePrice(amount: number): string {
  return amount <= 0 ? 'Free' : `$${amount}`
}

export function describeHostPricing(pricing: HostPricing): string {
  const parts = [`Dry ${formatServicePrice(pricing.dryPrice)}`]
  if (pricing.foldingPrice > 0) {
    parts.push(`Folding ${formatServicePrice(pricing.foldingPrice)}`)
  }
  parts.push(`Sheets ${formatServicePrice(pricing.sheetsPrice)}`)
  return parts.join(' · ')
}

export interface BookingPriceInput {
  loads: number
  dryPrice: number
  foldingPrice: number
  sheetsPrice: number
  sheetsOption: SheetsOption
  foldingService: boolean
}

export function calculateBookingTotal(input: BookingPriceInput): number {
  const { loads, dryPrice, foldingPrice, sheetsPrice, sheetsOption, foldingService } = input
  let total = dryPrice * loads
  if (sheetsOption === 'buy') total += sheetsPrice * loads
  if (foldingService && foldingPrice > 0) total += foldingPrice * loads
  return total
}

export function bookingTotalLabel(input: BookingPriceInput): string {
  const parts: string[] = []
  parts.push(`${formatServicePrice(input.dryPrice)} dry × ${input.loads}`)
  if (input.sheetsOption === 'buy') {
    parts.push(`${formatServicePrice(input.sheetsPrice)} sheets × ${input.loads}`)
  }
  if (input.foldingService && input.foldingPrice > 0) {
    parts.push(`${formatServicePrice(input.foldingPrice)} folding × ${input.loads}`)
  }
  return parts.join(' + ')
}

export function parsePriceInput(value: string): number {
  const n = parseInt(value.replace(/[^0-9]/g, ''), 10)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}
