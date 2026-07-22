import type { Host, HostPricing, HostSettings, SheetsOption } from '../types'

/** Dryer sheets included when a guest buys from the host. */
export const DRYER_SHEETS_PER_LOAD = 2

/** Price for {@link DRYER_SHEETS_PER_LOAD} dryer sheets when the guest buys from the host. */
export const DRYER_SHEETS_PRICE = 1

export function sheetsPurchaseTotalPerLoad(price = DRYER_SHEETS_PRICE): number {
  return Math.max(0, price)
}

export function formatDryerSheetsRate(price = DRYER_SHEETS_PRICE): string {
  if (price <= 0) return 'Free'
  return `$${price} for ${DRYER_SHEETS_PER_LOAD} sheets`
}

export function formatDryerSheetsPerLoadCharge(price = DRYER_SHEETS_PRICE): string {
  if (price <= 0) return 'Free'
  return `$${price} per load`
}

export const DEFAULT_HOST_PRICING: HostPricing = {
  dryPrice: 3,
  foldingPrice: 0,
  sheetsPrice: DRYER_SHEETS_PRICE,
}

export function getHostPricing(host: Host, settings?: HostSettings): HostPricing {
  const base = settings?.pricing ?? {
    dryPrice: host.price,
    foldingPrice: host.foldingPrice ?? 0,
    sheetsPrice: host.sheetsPrice ?? DRYER_SHEETS_PRICE,
  }
  return {
    dryPrice: base.dryPrice,
    foldingPrice: base.foldingPrice,
    sheetsPrice: base.sheetsPrice ?? DRYER_SHEETS_PRICE,
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
  parts.push(`Sheets ${formatDryerSheetsRate(pricing.sheetsPrice)}`)
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
  if (sheetsOption === 'buy') total += sheetsPurchaseTotalPerLoad(sheetsPrice) * loads
  if (foldingService && foldingPrice > 0) total += foldingPrice * loads
  return total
}

export function bookingTotalLabel(input: BookingPriceInput): string {
  const parts: string[] = []
  parts.push(`${formatServicePrice(input.dryPrice)} dry × ${input.loads}`)
  if (input.sheetsOption === 'buy') {
    parts.push(
      `${formatDryerSheetsPerLoadCharge(input.sheetsPrice)} (${formatDryerSheetsRate(input.sheetsPrice)}) × ${input.loads}`,
    )
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
  if (input.foldingService && input.foldingPrice > 0) {
    lines.push({
      label: 'Folding',
      amount: input.foldingPrice * input.loads,
    })
  }
  if (input.sheetsOption === 'buy') {
    lines.push({
      label: 'Dryer Sheets',
      amount: sheetsPurchaseTotalPerLoad(input.sheetsPrice) * input.loads,
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

  if (input.sheetsOption === 'buy') {
    lines.push({
      label: 'Dryer sheets',
      detail: loadLabel,
      amount: sheetsPurchaseTotalPerLoad(input.sheetsPrice) * input.loads,
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

export function parsePriceInput(value: string): number {
  const n = parseInt(value.replace(/[^0-9]/g, ''), 10)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}
