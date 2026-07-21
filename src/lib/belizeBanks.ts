export const BELIZE_BANKS = [
  'Atlantic Bank',
  'Belize Bank',
  'Heritage Bank',
  'National Bank of Belize',
] as const

export type BelizeBank = (typeof BELIZE_BANKS)[number]

export function isBelizeBank(value: string): value is BelizeBank {
  return (BELIZE_BANKS as readonly string[]).includes(value)
}

/** Keep saved bank names on the approved list; clear unknown legacy values. */
export function normalizeBelizeBankName(value?: string | null): BelizeBank | '' {
  if (!value?.trim()) return ''
  return isBelizeBank(value.trim()) ? value.trim() : ''
}
