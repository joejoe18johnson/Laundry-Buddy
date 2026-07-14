/** The six administrative districts of Belize. */
export const BELIZE_DISTRICTS = [
  'Belize',
  'Cayo',
  'Corozal',
  'Orange Walk',
  'Stann Creek',
  'Toledo',
] as const

export type BelizeDistrict = (typeof BELIZE_DISTRICTS)[number]

export function isBelizeDistrict(label: string): label is BelizeDistrict {
  return (BELIZE_DISTRICTS as readonly string[]).includes(label)
}
