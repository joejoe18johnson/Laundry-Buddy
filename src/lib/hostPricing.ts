import type { Host, HostPricing, HostSettings } from '../types'
import { getAvailableHosts } from '../data/mockData'

/** Shown on booking and host profile — guests supply their own sheets. */
export const DRYER_SHEETS_GUEST_HINT =
  'Bring your own dryer sheets if you want them — hosts do not supply sheets.'

export const DEFAULT_HOST_PRICING: HostPricing = {
  dryPrice: 3,
  foldingPrice: 0,
  sheetsPrice: 0,
}

export function getHostPricing(host: Host, settings?: HostSettings): HostPricing {
  const base = settings?.pricing ?? {
    dryPrice: host.price,
    foldingPrice: host.foldingPrice ?? 0,
    sheetsPrice: host.sheetsPrice ?? 0,
  }
  return {
    dryPrice: base.dryPrice,
    foldingPrice: base.foldingPrice,
    sheetsPrice: 0,
  }
}

export function applyHostPricing(host: Host, settings?: HostSettings): Host {
  const pricing = getHostPricing(host, settings)
  return {
    ...host,
    price: pricing.dryPrice,
    foldingPrice: pricing.foldingPrice,
    sheetsPrice: 0,
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
  return parts.join(' · ')
}

export interface BookingPriceInput {
  loads: number
  dryPrice: number
  foldingPrice: number
  foldingService: boolean
}

export function calculateBookingTotal(input: BookingPriceInput): number {
  const { loads, dryPrice, foldingPrice, foldingService } = input
  let total = dryPrice * loads
  if (foldingService && foldingPrice > 0) total += foldingPrice * loads
  return total
}

export function bookingTotalLabel(input: BookingPriceInput): string {
  const parts: string[] = []
  parts.push(`${formatServicePrice(input.dryPrice)} dry × ${input.loads}`)
  if (input.foldingService && input.foldingPrice > 0) {
    parts.push(`${formatServicePrice(input.foldingPrice)} folding × ${input.loads}`)
  }
  return parts.join(' + ')
}

export type BookingFooterLine = {
  label: string
  amount: number
}

/** Optional add-ons for the booking footer — base dry total lives in the price badge. */
export function bookingFooterAddonLines(input: BookingPriceInput): BookingFooterLine[] {
  const lines: BookingFooterLine[] = []
  if (input.foldingService && input.foldingPrice > 0) {
    lines.push({
      label: 'Folding',
      amount: input.foldingPrice * input.loads,
    })
  }
  return lines
}

export function formatFooterAddonAmount(amount: number): string {
  return amount <= 0 ? 'Free' : `$${amount}`
}

export type BookingReceiptLine = {
  label: string
  detail: string
  amount: number
}

/** Line items for review cards and receipts — one row per charge. */
export function bookingReceiptLines(input: BookingPriceInput): BookingReceiptLine[] {
  const loadLabel = `${input.loads} load${input.loads === 1 ? '' : 's'}`
  const lines: BookingReceiptLine[] = [
    {
      label: 'Drying',
      detail: `${loadLabel} × ${formatServicePrice(input.dryPrice)}`,
      amount: input.dryPrice * input.loads,
    },
  ]

  if (input.foldingService && input.foldingPrice > 0) {
    lines.push({
      label: 'Folding',
      detail: loadLabel,
      amount: input.foldingPrice * input.loads,
    })
  }

  return lines
}

export function formatReceiptAmount(amount: number): string {
  if (amount <= 0) return 'Free'
  return `$${amount}`
}

export function parsePriceInput(value: string): number {
  const n = parseInt(value.replace(/[^0-9]/g, ''), 10)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

export interface MarketPricingSnapshot {
  avgDryPrice: number
  avgFoldingPrice: number | null
  hostCount: number
}

function averageRounded(values: number[]): number {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

/** Average rates across other active hosts on the marketplace (excludes current host). */
export function computeMarketPricingSnapshot(excludeHostId?: string): MarketPricingSnapshot | null {
  const hosts = getAvailableHosts().filter(
    (host) => host.slotsLeft > 0 && host.id !== excludeHostId,
  )
  if (hosts.length === 0) return null

  const foldingPrices = hosts
    .map((host) => host.foldingPrice ?? 0)
    .filter((price) => price > 0)

  return {
    avgDryPrice: averageRounded(hosts.map((host) => host.price)),
    avgFoldingPrice: foldingPrices.length > 0 ? averageRounded(foldingPrices) : null,
    hostCount: hosts.length,
  }
}

export function buildHostPricingHints(
  pricing: HostPricing,
  market: MarketPricingSnapshot,
  reputation?: { rating: number; reviewCount: number },
): string[] {
  const hints: string[] = []
  const dryDelta = pricing.dryPrice - market.avgDryPrice

  hints.push(
    `Hosts in your area average ${formatServicePrice(market.avgDryPrice)} per load (${market.hostCount} hosts online).`,
  )

  if (dryDelta <= -1) {
    hints.push(
      'Your dry price is below average — great for attracting first-time guests. Keep service quality high so reviews stay strong.',
    )
  } else if (dryDelta >= 1) {
    hints.push(
      'Your dry price is above average. Guests often choose lower prices, but strong reviews and ratings help you stand out.',
    )
  } else {
    hints.push(
      'Your dry price is near the local average. Competitive rates help fill slots; great reviews help guests pick you over similar prices.',
    )
  }

  if (reputation) {
    if (reputation.reviewCount === 0) {
      hints.push(
        'You have no reviews yet — a fair price and great service on early loads will build the rating guests trust most.',
      )
    } else if (reputation.rating >= 4.5) {
      hints.push(
        `Your ${reputation.rating.toFixed(1)}-star rating is a real advantage — guests will pay a bit more for a trusted host.`,
      )
    } else if (reputation.rating < 4) {
      hints.push(
        'Reviews matter as much as price — every smooth load helps your rating and brings repeat guests.',
      )
    }
  }

  if (market.avgFoldingPrice != null && pricing.foldingPrice === 0) {
    hints.push(
      `Many hosts charge around ${formatServicePrice(market.avgFoldingPrice)} for folding — optional add-ons can boost earnings without raising your base dry rate.`,
    )
  }

  return hints
}

