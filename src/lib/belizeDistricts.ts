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

/** Default search radius when a guest picks one of the curated areas. */
export const FILTER_AREA_RADIUS_KM = 3

/** Approximate map center for each curated filter area. */
export const FILTER_AREA_CENTERS: Record<
  BelizeFilterArea,
  { latitude: number; longitude: number }
> = {
  Belmopan: { latitude: 17.251, longitude: -88.759 },
  'San Ignacio': { latitude: 17.156, longitude: -89.069 },
  'Santa Elena': { latitude: 17.151, longitude: -89.064 },
  'Corozal Town': { latitude: 18.3938, longitude: -88.3885 },
  'Orange Walk Town': { latitude: 18.0812, longitude: -88.563 },
  'Belize City': { latitude: 17.5046, longitude: -88.1962 },
  'San Pedro': { latitude: 17.9214, longitude: -87.9611 },
  'Caye Caulker': { latitude: 17.7612, longitude: -88.0277 },
}

export function isBelizeFilterArea(label: string): label is BelizeFilterArea {
  const key = label.trim().toLowerCase()
  return BELIZE_FILTER_AREAS.some((area) => area.toLowerCase() === key)
}

export function getFilterAreaCenter(
  label: string,
): ({ label: BelizeFilterArea } & (typeof FILTER_AREA_CENTERS)[BelizeFilterArea]) | null {
  const match = BELIZE_FILTER_AREAS.find((area) => area.toLowerCase() === label.trim().toLowerCase())
  if (!match) return null
  return { label: match, ...FILTER_AREA_CENTERS[match] }
}

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

/** District for each curated filter area (search subtitle). */
export const FILTER_AREA_DISTRICT: Record<BelizeFilterArea, BelizeDistrict> = {
  Belmopan: 'Cayo',
  'San Ignacio': 'Cayo',
  'Santa Elena': 'Cayo',
  'Corozal Town': 'Corozal',
  'Orange Walk Town': 'Orange Walk',
  'Belize City': 'Belize',
  'San Pedro': 'Belize',
  'Caye Caulker': 'Belize',
}

/** Resolve a town/area label to its Belize district for search subtitles. */
export function getDistrictForSearchPlace(label: string): BelizeDistrict | null {
  const trimmed = label.trim()
  if (isBelizeFilterArea(trimmed)) return FILTER_AREA_DISTRICT[trimmed]
  if (isBelizeDistrict(trimmed)) return trimmed

  const key = trimmed.toLowerCase()
  for (const district of BELIZE_DISTRICTS) {
    if (key === district.toLowerCase()) return district
  }

  for (const [areaKey, aliases] of Object.entries(FILTER_ALIASES)) {
    const filterArea = BELIZE_FILTER_AREAS.find((a) => a.toLowerCase() === areaKey)
    if (!filterArea) continue
    if (key === areaKey || aliases.some((alias) => key === alias || key.includes(alias))) {
      return FILTER_AREA_DISTRICT[filterArea]
    }
  }

  return null
}

export function getPlaceSearchSubtitle(label: string, district?: string): string {
  const resolved =
    (district && isBelizeDistrict(district) ? district : null) ?? getDistrictForSearchPlace(label)
  return resolved ? `Search in ${resolved}` : `Search in ${label.trim()}`
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
