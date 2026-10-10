import type {
  Booking,
  DetergentOption,
  Host,
  HostPricing,
  HostSettings,
  LaundryServiceMode,
} from '../types'
import { getAvailableHosts } from '../data/mockData'

/** Host sells detergent for wash loads — fixed platform price per load. */
export const HOST_DETERGENT_PRICE = 1

/** Optional add-on — $1 per pack of 2 dryer sheets from the host. */
export const DRYER_SHEETS_PACK_PRICE = 1
export const DRYER_SHEETS_PER_PACK = 2

export const DRYER_SHEETS_DETAIL = `${DRYER_SHEETS_PER_PACK} for $${DRYER_SHEETS_PACK_PRICE} or bring your own`

export const DRYER_SHEETS_OFFER_HINT = `Dryer sheets — ${DRYER_SHEETS_DETAIL}.`

export const DETERGENT_ADD_ON_LABEL = `Add detergent — $${HOST_DETERGENT_PRICE} per load`

export const DETERGENT_GUEST_HINT =
  'Bring your own detergent, or add detergent from your host for $1 per load.'

/** Shown on booking — a load is a standard load; hosts rely on the guest photo. */
export const LOAD_PHOTO_GUEST_HINT =
  'To assist your host with preparation, you will be asked to submit a photograph of your laundry load in the next step. We estimate capacity based on a Standard Load rather than exact measurements.'

/** @deprecated Use DRYER_SHEETS_OFFER_HINT */
export const DRYER_SHEETS_GUEST_HINT = DRYER_SHEETS_OFFER_HINT

export const DEFAULT_HOST_PRICING: HostPricing = {
  washPrice: 3,
  dryPrice: 3,
  foldingPrice: 0,
  sheetsPrice: 0,
}

export function getHostPricing(host: Host, settings?: HostSettings): HostPricing {
  const base = settings?.pricing ?? {
    washPrice: host.washPrice ?? host.price ?? DEFAULT_HOST_PRICING.washPrice,
    dryPrice: host.dryPrice ?? DEFAULT_HOST_PRICING.dryPrice,
    foldingPrice: host.foldingPrice ?? 0,
    sheetsPrice: host.sheetsPrice ?? 0,
  }
  return {
    washPrice: base.washPrice ?? DEFAULT_HOST_PRICING.washPrice,
    dryPrice: base.dryPrice ?? 0,
    foldingPrice: base.foldingPrice,
    sheetsPrice: 0,
  }
}

export function applyHostPricing(host: Host, settings?: HostSettings): Host {
  const pricing = getHostPricing(host, settings)
  return {
    ...host,
    price: pricing.washPrice,
    washPrice: pricing.washPrice,
    dryPrice: pricing.dryPrice,
    foldingPrice: pricing.foldingPrice,
    sheetsPrice: 0,
  }
}

export function offersFoldingService(pricing: HostPricing): boolean {
  return pricing.foldingPrice > 0
}

export function offersLaundryService(pricing: HostPricing): boolean {
  return pricing.washPrice > 0
}

export function offersDryService(pricing: HostPricing): boolean {
  return pricing.dryPrice > 0
}

/** @deprecated Use offersDryService */
export function offersWashAndDryService(pricing: HostPricing): boolean {
  return offersDryService(pricing)
}

export function includesWashing(mode: LaundryServiceMode): boolean {
  return mode === 'wash_only' || mode === 'wash_and_dry'
}

export function includesDrying(mode: LaundryServiceMode): boolean {
  return mode === 'dry_only' || mode === 'wash_and_dry'
}

export function formatServicePrice(amount: number): string {
  return amount <= 0 ? 'Free' : `$${amount}`
}

export type HostServiceDetailItem = {
  label: string
  value: string
}

/** Guest-facing service list — fixed order on profile and booking. */
/** Per-load price shown on the map and host list for the selected service filter. */
export function hostListPriceForService(
  host: Host,
  mode: LaundryServiceMode,
  settings?: HostSettings,
): number | null {
  const pricing = getHostPricing(host, settings)
  if (mode === 'wash_only') {
    return pricing.washPrice > 0 ? pricing.washPrice : null
  }
  if (mode === 'dry_only') {
    return pricing.dryPrice > 0 ? pricing.dryPrice : null
  }
  if (pricing.washPrice > 0 && pricing.dryPrice > 0) {
    return pricing.washPrice + pricing.dryPrice
  }
  if (pricing.washPrice > 0) return pricing.washPrice
  if (pricing.dryPrice > 0) return pricing.dryPrice
  return null
}

export function mapServiceFilterShortLabel(mode: LaundryServiceMode): string {
  if (mode === 'wash_only') return 'Laundry'
  if (mode === 'dry_only') return 'Dry'
  return 'Wash + dry'
}

export function hostServiceDetailItems(pricing: HostPricing): HostServiceDetailItem[] {
  const items: HostServiceDetailItem[] = [
    {
      label: 'Laundry (wash)',
      value: `${formatServicePrice(pricing.washPrice)} per load`,
    },
    {
      label: 'Add detergent',
      value: `$${HOST_DETERGENT_PRICE} per load or bring your own`,
    },
  ]
  if (pricing.dryPrice > 0) {
    items.push({
      label: 'Drying',
      value: `${formatServicePrice(pricing.dryPrice)} per load`,
    })
  }
  if (pricing.foldingPrice > 0) {
    items.push({
      label: 'Folding',
      value: `${formatServicePrice(pricing.foldingPrice)} per load`,
    })
  }
  items.push({
    label: 'Dryer sheets',
    value: DRYER_SHEETS_DETAIL,
  })
  return items
}

export function describeHostPricing(pricing: HostPricing): string {
  const parts = [`Laundry ${formatServicePrice(pricing.washPrice)}`]
  if (pricing.dryPrice > 0) {
    parts.push(`Dry ${formatServicePrice(pricing.dryPrice)}`)
  }
  if (pricing.foldingPrice > 0) {
    parts.push(`Folding ${formatServicePrice(pricing.foldingPrice)}`)
  }
  return parts.join(' · ')
}

export function resolveLaundryServiceMode(booking: Booking): LaundryServiceMode {
  const mode = booking.laundryServiceMode
  if (mode === 'wash_only' || mode === 'dry_only' || mode === 'wash_and_dry') {
    return mode
  }
  if (booking.washService) return 'wash_and_dry'
  return 'dry_only'
}

export function normalizeLaundryServiceMode(
  requested: LaundryServiceMode,
  pricing: HostPricing,
): LaundryServiceMode {
  const canWash = offersLaundryService(pricing)
  const canDry = offersDryService(pricing)

  if (requested === 'dry_only' && canDry) return 'dry_only'
  if (requested === 'wash_and_dry' && canWash && canDry) return 'wash_and_dry'
  if (requested === 'wash_only' && canWash) return 'wash_only'

  if (canWash) return 'wash_only'
  if (canDry) return 'dry_only'
  return 'wash_only'
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
  const { pricing, loads, detergentOption, dryerSheetsPacks, foldingService } = params
  const mode = normalizeLaundryServiceMode(params.laundryServiceMode, pricing)
  return {
    loads,
    dryPrice: pricing.dryPrice,
    washPrice: pricing.washPrice,
    laundryServiceMode: mode,
    detergentOption: includesWashing(mode) ? detergentOption : 'own',
    dryerSheetsPacks: includesDrying(mode) ? Math.max(0, dryerSheetsPacks) : 0,
    foldingPrice: pricing.foldingPrice,
    foldingService: offersFoldingService(pricing) && foldingService,
  }
}

export function buildBookingPriceInputFromBooking(booking: Booking): BookingPriceInput {
  const mode = resolveLaundryServiceMode(booking)
  return {
    loads: booking.loads,
    dryPrice: booking.dryPrice ?? 0,
    washPrice: booking.washPrice ?? booking.pricePerLoad ?? 0,
    laundryServiceMode: mode,
    detergentOption: booking.detergentOption ?? 'own',
    dryerSheetsPacks: booking.dryerSheetsPacks ?? 0,
    foldingPrice: booking.foldingPrice ?? 0,
    foldingService: booking.foldingService ?? false,
  }
}

function detergentTotal(input: BookingPriceInput): number {
  if (!includesWashing(input.laundryServiceMode)) return 0
  if (input.detergentOption !== 'buy') return 0
  return HOST_DETERGENT_PRICE * input.loads
}

function dryerSheetsTotal(input: BookingPriceInput): number {
  if (!includesDrying(input.laundryServiceMode)) return 0
  return Math.max(0, input.dryerSheetsPacks) * DRYER_SHEETS_PACK_PRICE
}

export function calculateBookingTotal(input: BookingPriceInput): number {
  const { loads, dryPrice, washPrice, laundryServiceMode, foldingPrice, foldingService } = input
  let total = 0
  if (includesWashing(laundryServiceMode) && washPrice > 0) {
    total += washPrice * loads
  }
  if (includesDrying(laundryServiceMode) && dryPrice > 0) {
    total += dryPrice * loads
  }
  total += detergentTotal(input)
  total += dryerSheetsTotal(input)
  if (foldingService && foldingPrice > 0) total += foldingPrice * loads
  return total
}

export function bookingTotalLabel(input: BookingPriceInput): string {
  const parts: string[] = []
  if (includesWashing(input.laundryServiceMode) && input.washPrice > 0) {
    parts.push(`${formatServicePrice(input.washPrice)} laundry × ${input.loads}`)
  }
  if (includesDrying(input.laundryServiceMode) && input.dryPrice > 0) {
    parts.push(`${formatServicePrice(input.dryPrice)} dry × ${input.loads}`)
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

/** Optional add-ons for the booking footer — base laundry total lives in the price badge. */
export function bookingFooterAddonLines(input: BookingPriceInput): BookingFooterLine[] {
  const lines: BookingFooterLine[] = []
  const detergent = detergentTotal(input)
  if (detergent > 0) {
    lines.push({ label: 'Add detergent', amount: detergent })
  }
  if (includesDrying(input.laundryServiceMode) && input.dryPrice > 0) {
    lines.push({
      label: 'Drying',
      amount: input.dryPrice * input.loads,
    })
  }
  if (input.foldingService && input.foldingPrice > 0) {
    lines.push({
      label: 'Folding',
      amount: input.foldingPrice * input.loads,
    })
  }
  const sheets = dryerSheetsTotal(input)
  if (sheets > 0) {
    lines.push({ label: 'Dryer sheets', amount: sheets })
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
  const lines: BookingReceiptLine[] = []

  if (includesWashing(input.laundryServiceMode) && input.washPrice > 0) {
    lines.push({
      label: 'Laundry (wash)',
      detail: `${loadLabel} × ${formatServicePrice(input.washPrice)}`,
      amount: input.washPrice * input.loads,
    })
  }

  const detergent = detergentTotal(input)
  if (detergent > 0) {
    lines.push({
      label: 'Add detergent',
      detail: `${loadLabel} · from host`,
      amount: detergent,
    })
  }

  if (includesDrying(input.laundryServiceMode) && input.dryPrice > 0) {
    lines.push({
      label: 'Drying',
      detail: `${loadLabel} × ${formatServicePrice(input.dryPrice)}`,
      amount: input.dryPrice * input.loads,
    })
  }

  if (input.foldingService && input.foldingPrice > 0) {
    lines.push({
      label: 'Folding',
      detail: loadLabel,
      amount: input.foldingPrice * input.loads,
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

  return lines
}

export function formatReceiptAmount(amount: number): string {
  if (amount <= 0) return 'Free'
  return `$${amount}`
}

export function laundryServiceLabel(mode: LaundryServiceMode): string {
  if (mode === 'wash_only') return 'Laundry (wash)'
  if (mode === 'dry_only') return 'Dry only'
  return 'Wash + dry'
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
  pricePerLoad: number
} {
  const detergentPrice = detergentTotal(input)
  const dryerSheetsPrice = dryerSheetsTotal(input)
  const mode = input.laundryServiceMode
  return {
    dryPrice: input.dryPrice,
    foldingPrice: input.foldingPrice,
    foldingService: input.foldingService,
    totalAmount: calculateBookingTotal(input),
    washPrice: input.washPrice,
    washService: includesWashing(mode),
    laundryServiceMode: mode,
    detergentOption: includesWashing(mode) ? input.detergentOption : null,
    detergentPrice: detergentPrice > 0 ? detergentPrice : undefined,
    dryerSheetsPacks: input.dryerSheetsPacks,
    dryerSheetsPrice: dryerSheetsPrice > 0 ? dryerSheetsPrice : undefined,
    pricePerLoad: includesWashing(mode) ? input.washPrice : input.dryPrice,
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
    avgDryPrice: averageRounded(hosts.map((host) => host.washPrice ?? host.price)),
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
  const washDelta = pricing.washPrice - market.avgDryPrice

  hints.push(
    `Hosts in your area average ${formatServicePrice(market.avgDryPrice)} per load for laundry (${market.hostCount} hosts online).`,
  )

  if (washDelta <= -1) {
    hints.push(
      'Your laundry price is below average — great for attracting first-time guests. Keep service quality high so reviews stay strong.',
    )
  } else if (washDelta >= 1) {
    hints.push(
      'Your laundry price is above average. Guests often choose lower prices, but strong reviews and ratings help you stand out.',
    )
  } else {
    hints.push(
      'Your laundry price is near the local average. Competitive rates help fill slots; great reviews help guests pick you over similar prices.',
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
      `Many hosts charge around ${formatServicePrice(market.avgFoldingPrice)} for folding — optional add-ons can boost earnings without raising your base laundry rate.`,
    )
  }

  if (pricing.dryPrice === 0) {
    hints.push(
      'Set a drying price if you offer dryer use — guests can add drying to laundry or book dry-only.',
    )
  }

  return hints
}
