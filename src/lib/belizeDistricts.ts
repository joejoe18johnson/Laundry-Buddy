/** Curated town/area chips for search and filters — not every village. */
export const BELIZE_FILTER_AREAS = [
  'Belmopan',
  'San Ignacio',
  'Santa Elena',
  'Corozal Town',
  'Orange Walk Town',
  'Belize City',
  'San Pedro',
  'Caye Caulker',
] as const

export type BelizeFilterArea = (typeof BELIZE_FILTER_AREAS)[number]

/** The six administrative districts of Belize (legacy / search suggestions). */
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

const FILTER_ALIASES: Record<string, string[]> = {
  belmopan: ['belmopan'],
  'san ignacio': [
    'san ignacio',
    'las flores',
    'ub area',
    'ub dorms',
    'succotz',
    'maya mopan',
    'cristo rey',
    'bullet tree',
    'esperanza',
    'georgeville',
    'teakettle',
    'camalote',
    'roaring creek',
    'salvapan',
  ],
  'santa elena': ['santa elena', 'las flores', 'maya mopan'],
  'corozal town': ['corozal'],
  'orange walk town': ['orange walk'],
  'belize city': [
    'belize city',
    'ladyville',
    'hattieville',
    'belama',
    'collet',
    'kings park',
    'port loyola',
    'freetown',
    'gracie rock',
  ],
  'san pedro': ['san pedro'],
  'caye caulker': ['caye caulker'],
}

function hostHaystack(host: { location: string; district?: string; address: string }): string {
  return `${host.location} ${host.district ?? ''} ${host.address}`.toLowerCase()
}

/** Match a host to one of the curated filter-area labels. */
export function hostMatchesFilterArea(
  host: { location: string; district?: string; address: string },
  area: string,
): boolean {
  const haystack = hostHaystack(host)
  const key = area.trim().toLowerCase()
  if (!key) return true
  if (haystack.includes(key)) return true
  const aliases = FILTER_ALIASES[key] ?? [key]
  return aliases.some((token) => haystack.includes(token))
}
