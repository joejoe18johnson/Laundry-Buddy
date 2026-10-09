import type {
  Booking,
  DetergentOption,
  Host,
  HostPricing,
  HostSettings,
  LaundryServiceMode,
} from '../types'
import { getAvailableHosts } from '../data/mockData'

/** Host sells detergent for wash + dry loads — fixed platform price per load. */
export const HOST_DETERGENT_PRICE = 1

/** Optional add-on — $1 per pack of 2 dryer sheets from the host. */
export const DRYER_SHEETS_PACK_PRICE = 1
export const DRYER_SHEETS_PER_PACK = 2

export const DRYER_SHEETS_OFFER_HINT = `Add dryer sheets from your host — $${DRYER_SHEETS_PACK_PRICE} for ${DRYER_SHEETS_PER_PACK} sheets per pack. Bring your own if you prefer.`

export const DETERGENT_GUEST_HINT =
  'For wash + dry, bring your own detergent or buy from your host for $1 per load.'

/** Shown on booking — a load is a standard load; hosts rely on the guest photo. */
export const LOAD_PHOTO_GUEST_HINT =
  'To assist your host with preparation, you will be asked to submit a photograph of your laundry load in the next step. We estimate capacity based on a Standard Load rather than exact measurements.'

/** @deprecated Use DRYER_SHEETS_OFFER_HINT */
export const DRYER_SHEETS_GUEST_HINT = DRYER_SHEETS_OFFER_HINT

export const DEFAULT_HOST_PRICING: HostPricing = {
  dryPrice: 3,
  washPrice: 0,
  foldingPrice: 0,
  sheetsPrice: 0,
}

export function getHostPricing(host: Host, settings?: HostSettings): HostPricing {
  const base = settings?.pricing ?? {
    dryPrice: host.price,
    washPrice: host.washPrice ?? 0,
    foldingPrice: host.foldingPrice ?? 0,
    sheetsPrice: host.sheetsPrice ?? 0,
  }
  return {
    dryPrice: base.dryPrice,
    washPrice: base.washPrice ?? 0,
    foldingPrice: base.foldingPrice,
    sheetsPrice: 0,
  }
}

export function applyHostPricing(host: Host, settings?: HostSettings): Host {
  const pricing = getHostPricing(host, settings)
  return {
    ...host,
    price: pricing.dryPrice,
    washPrice: pricing.washPrice,
    foldingPrice: pricing.foldingPrice,
    sheetsPrice: 0,
  }
}

export function offersFoldingService(pricing: HostPricing): boolean {
  return pricing.foldingPrice > 0
}

export function offersWashAndDryService(pricing: HostPricing): boolean {
  return pricing.washPrice > 0
}

export function formatServicePrice(amount: number): string {
  return amount <= 0 ? 'Free' : `$${amount}`
}

export function describeHostPricing(pricing: HostPricing): string {
  const parts = [`Dry ${formatServicePrice(pricing.dryPrice)}`]
  if (pricing.washPrice > 0) {
    parts.push(`Wash + dry ${formatServicePrice(pricing.washPrice)}`)
  }
  if (pricing.foldingPrice > 0) {
    parts.push(`Folding ${formatServicePrice(pricing.foldingPrice)}`)
  }
  return parts.join(' · ')
}

export function resolveLaundryServiceMode(booking: Booking): LaundryServiceMode {
  if (booking.laundryServiceMode) return booking.laundryServiceMode
  if (booking.washService) return 'wash_and_dry'
  return 'dry_only'
}

export interface BookingPriceInput {
  loads: number
  dryPrice: number
  washPrice: number
  laundryServiceMode: LaundryServiceMode
  detergentOption: DetergentOption
  dryerSheetsPacks: number
  foldingPrice: number
  foldingService: boolean
}

export function buildBookingPriceInput(params: {
  loads: number
  pricing: HostPricing
  laundryServiceMode: LaundryServiceMode
  detergentOption: DetergentOption
  dryerSheetsPacks: number
  foldingService: boolean
}): BookingPriceInput {
  const { pricing, loads, laundryServiceMode, detergentOption, dryerSheetsPacks, foldingService } =
    params
  const mode: LaundryServiceMode =
    laundryServiceMode === 'wash_and_dry' && offersWashAndDryService(pricing)
      ? 'wash_and_dry'
      : 'dry_only'
  return {
    loads,
    dryPrice: pricing.dryPrice,
    washPrice: pricing.washPrice,
    laundryServiceMode: mode,
    detergentOption: mode === 'wash_and_dry' ? detergentOption : 'own',
    dryerSheetsPacks: Math.max(0, dryerSheetsPacks),
    foldingPrice: pricing.foldingPrice,
    foldingService: offersFoldingService(pricing) && foldingService,
  }
}

export function buildBookingPriceInputFromBooking(booking: Booking): BookingPriceInput {
  const mode = resolveLaundryServiceMode(booking)
  return {
    loads: booking.loads,
    dryPrice: booking.dryPrice ?? booking.pricePerLoad ?? 0,
    washPrice: booking.washPrice ?? 0,
    laundryServiceMode: mode,
    detergentOption: booking.detergentOption ?? 'own',
    dryerSheetsPacks: booking.dryerSheetsPacks ?? 0,
    foldingPrice: booking.foldingPrice ?? 0,
    foldingService: booking.foldingService ?? false,
  }
}

function detergentTotal(input: BookingPriceInput): number {
  if (input.laundryServiceMode !== 'wash_and_dry') return 0
  if (input.detergentOption !== 'buy') return 0
  return HOST_DETERGENT_PRICE * input.loads
}

function dryerSheetsTotal(input: BookingPriceInput): number {
  return Math.max(0, input.dryerSheetsPacks) * DRYER_SHEETS_PACK_PRICE
}

export function calculateBookingTotal(input: BookingPriceInput): number {
  const { loads, dryPrice, washPrice, laundryServiceMode, foldingPrice, foldingService } = input
  let total = dryPrice * loads
  if (laundryServiceMode === 'wash_and_dry' && washPrice > 0) {
    total += washPrice * loads
  }
  total += detergentTotal(input)
  total += dryerSheetsTotal(input)
  if (foldingService && foldingPrice > 0) total += foldingPrice * loads
  return total
}

export function bookingTotalLabel(input: BookingPriceInput): string {
  const parts: string[] = []
  parts.push(`${formatServicePrice(input.dryPrice)} dry × ${input.loads}`)
  if (input.laundryServiceMode === 'wash_and_dry' && input.washPrice > 0) {
    parts.push(`${formatServicePrice(input.washPrice)} wash × ${input.loads}`)
  }
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
  if (input.laundryServiceMode === 'wash_and_dry' && input.washPrice > 0) {
    lines.push({
      label: 'Washing',
      amount: input.washPrice * input.loads,
    })
  }
  const detergent = detergentTotal(input)
  if (detergent > 0) {
    lines.push({ label: 'Detergent', amount: detergent })
  }
  const sheets = dryerSheetsTotal(input)
  if (sheets > 0) {
    lines.push({ label: 'Dryer sheets', amount: sheets })
  }
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
      label: input.laundryServiceMode === 'wash_and_dry' ? 'Drying (wash + dry)' : 'Drying',
      detail: `${loadLabel} × ${formatServicePrice(input.dryPrice)}`,
      amount: input.dryPrice * input.loads,
    },
  ]

  if (input.laundryServiceMode === 'wash_and_dry' && input.washPrice > 0) {
    lines.push({
      label: 'Washing',
      detail: loadLabel,
      amount: input.washPrice * input.loads,
    })
  }

  const detergent = detergentTotal(input)
  if (detergent > 0) {
    lines.push({
      label: 'Detergent',
      detail: `${loadLabel} · from host`,
      amount: detergent,
    })
  }

  const sheets = dryerSheetsTotal(input)
  if (sheets > 0) {
    lines.push({
      label: 'Dryer sheets',
      detail: `${input.dryerSheetsPacks} pack${input.dryerSheetsPacks === 1 ? '' : 's'} (${DRYER_SHEETS_PER_PACK} each)`,
      amount: sheets,
    })
  }

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

export function laundryServiceLabel(mode: LaundryServiceMode): string {
  return mode === 'wash_and_dry' ? 'Wash + dry' : 'Dry only'
}

/** Price fields stored on the booking at request time. */
export function bookingChargeSnapshot(input: BookingPriceInput): {
  totalAmount: number
  washPrice: number
  washService: boolean
  laundryServiceMode: LaundryServiceMode
  detergentOption: DetergentOption | null
  detergentPrice?: number
  dryerSheetsPacks: number
  dryerSheetsPrice?: number
  foldingPrice: number
  foldingService: boolean
  dryPrice: number
} {
  const detergentPrice = detergentTotal(input)
  const dryerSheetsPrice = dryerSheetsTotal(input)
  return {
    dryPrice: input.dryPrice,
    foldingPrice: input.foldingPrice,
    foldingService: input.foldingService,
    totalAmount: calculateBookingTotal(input),
    washPrice: input.laundryServiceMode === 'wash_and_dry' ? input.washPrice : 0,
    washService: input.laundryServiceMode === 'wash_and_dry',
    laundryServiceMode: input.laundryServiceMode,
    detergentOption: input.laundryServiceMode === 'wash_and_dry' ? input.detergentOption : null,
    detergentPrice: detergentPrice > 0 ? detergentPrice : undefined,
    dryerSheetsPacks: input.dryerSheetsPacks,
    dryerSheetsPrice: dryerSheetsPrice > 0 ? dryerSheetsPrice : undefined,
  }
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

  if (pricing.washPrice === 0) {
    hints.push(
      'Offer wash + dry with a separate wash price if you want guests to drop off dirty laundry — dry-only stays available either way.',
    )
  }

  return hints
}
