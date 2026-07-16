import type { Host } from '../types'
import { BELIZE_DISTRICTS, type BelizeDistrict } from '../lib/belizeDistricts'

/** Minimum hosts clustered in Belmopan for demo / testing. */
const BELMOPAN_HOST_COUNT = 22

/** Hosts scattered across each district (excluding the Belmopan cluster). */
const SCATTERED_PER_DISTRICT = 10

const BELMOPAN_CENTER = { latitude: 17.251, longitude: -88.759 }

const FIRST_NAMES = [
  'Sofia', 'Diego', 'Rosa', 'Carlos', 'Elena', 'Marco', 'Ana', 'Luis',
  'Gabriela', 'Jorge', 'Patricia', 'Ramon', 'Isabel', 'Oscar', 'Teresa',
  'Felipe', 'Nina', 'Hector', 'Valeria', 'Andres', 'Camila', 'Ricardo',
  'Daniela', 'Pablo', 'Monica', 'Sergio', 'Laura', 'Victor', 'Adriana',
  'Miguel', 'Claudia', 'Eduardo', 'Beatriz', 'Fernando', 'Silvia',
  'Antonio', 'Mariana', 'Roberto', 'Lucia', 'Javier', 'Carmen', 'Pedro',
]

const DRYER_TYPES = ['Electric', 'Gas', 'Electric', 'Electric', 'Gas']

type DistrictSeedConfig = {
  center: { latitude: number; longitude: number }
  areas: string[]
  spreadKm: number
}

const DISTRICT_CONFIG: Record<BelizeDistrict, DistrictSeedConfig> = {
  Belize: {
    center: { latitude: 17.499, longitude: -88.188 },
    spreadKm: 22,
    areas: [
      'Belize City', 'Ladyville', 'Hattieville', 'San Pedro', 'Caye Caulker',
      'Burrell Boom', 'Gracie Rock', 'Freetown', 'Port Loyola', 'Kings Park',
    ],
  },
  Cayo: {
    center: { latitude: 17.156, longitude: -89.069 },
    spreadKm: 16,
    areas: [
      'San Ignacio', 'Santa Elena', 'Las Flores', 'UB Area', 'Maya Mopan',
      'Cristo Rey', 'Bullet Tree', 'Esperanza', 'Georgeville', 'Succotz',
    ],
  },
  Corozal: {
    center: { latitude: 18.393, longitude: -88.388 },
    spreadKm: 24,
    areas: [
      'Corozal Town', 'Concepcion', 'San Narciso', 'San Victor', 'Calcutta',
      'Patchakan', 'Progresso', 'Copper Bank', 'Sarteneja', 'Chunox',
    ],
  },
  'Orange Walk': {
    center: { latitude: 18.075, longitude: -88.56 },
    spreadKm: 24,
    areas: [
      'Orange Walk Town', 'San Estevan', 'San Pablo', 'Trial Farm', 'Guinea Grass',
      'Shipyard', 'Yo Creek', 'San Carlos', 'San Jose', 'San Roman',
    ],
  },
  'Stann Creek': {
    center: { latitude: 16.969, longitude: -88.233 },
    spreadKm: 26,
    areas: [
      'Dangriga', 'Hopkins', 'Placencia', 'Seine Bight', 'Maya Beach',
      'Independence', 'Mango Creek', 'Red Bank', 'Sittee River', 'Georgetown',
    ],
  },
  Toledo: {
    center: { latitude: 16.098, longitude: -88.81 },
    spreadKm: 26,
    areas: [
      'Punta Gorda', 'San Antonio', 'Big Falls', 'San Pedro Columbia', 'Blue Creek',
      'Jalacte', 'Silver Creek', 'Monkey River', 'Barranco', 'San Miguel',
    ],
  },
}

function coordAroundCenter(
  center: { latitude: number; longitude: number },
  index: number,
  maxSpreadKm: number,
): { latitude: number; longitude: number } {
  const angleDeg = (index * 137.508) % 360
  const angle = (angleDeg * Math.PI) / 180
  const distanceKm = 0.4 + ((index * 0.71) % maxSpreadKm)
  const latRad = (center.latitude * Math.PI) / 180
  const latitude = center.latitude + (distanceKm / 111.32) * Math.cos(angle)
  const longitude =
    center.longitude + (distanceKm / (111.32 * Math.cos(latRad))) * Math.sin(angle)
  return {
    latitude: Math.round(latitude * 10000) / 10000,
    longitude: Math.round(longitude * 10000) / 10000,
  }
}

function districtHostUserId(globalIndex: number): string {
  return `gen-host-${String(globalIndex).padStart(3, '0')}`
}

type HostSeedInput = {
  globalIndex: number
  id: string
  location: string
  district: BelizeDistrict
  center: { latitude: number; longitude: number }
  spreadKm: number
  slot: number
}

function createHost(input: HostSeedInput): Host {
  const { globalIndex, id, location, district, center, spreadKm, slot } = input
  const name = FIRST_NAMES[(globalIndex + slot) % FIRST_NAMES.length]
  const { latitude, longitude } = coordAroundCenter(center, slot + 1, spreadKm)
  const price = [3, 4, 5, 6, 4, 5][globalIndex % 6]
  const foldingPrice = [0, 2, 3, 4][globalIndex % 4]
  const rating = globalIndex % 7 === 0 ? 0 : 3.8 + (globalIndex % 12) * 0.1

  return {
    id,
    hostUserId: districtHostUserId(globalIndex),
    name: globalIndex > FIRST_NAMES.length ? `${name} ${Math.floor(globalIndex / FIRST_NAMES.length)}` : name,
    location,
    district,
    rating: Math.min(5, Math.round(rating * 10) / 10),
    reviewCount: rating > 0 ? 3 + (globalIndex % 40) : 0,
    price,
    foldingPrice,
    sheetsPrice: 1 + (globalIndex % 2),
    slotsLeft: 1 + (globalIndex % 4),
    turnaroundHours: 2 + (globalIndex % 4),
    dryerType: DRYER_TYPES[globalIndex % DRYER_TYPES.length],
    hasGenerator: globalIndex % 3 === 0,
    address: `${10 + (globalIndex % 80)} ${location} Rd., ${district}`,
    gateCode: String(1000 + ((globalIndex * 137) % 9000)),
    whatsapp: `501600${String(2000 + globalIndex).slice(-4)}`,
    latitude,
    longitude,
    photos: ['Home dryer setup', 'Drop-off area'],
    rules: ['Text before drop-off', 'Pick up within 24 hrs'],
  }
}

/** Generate Belmopan cluster + hosts scattered across all six districts. */
export function generateSeedHosts(
  belmopanCount = BELMOPAN_HOST_COUNT,
  perDistrict = SCATTERED_PER_DISTRICT,
): Host[] {
  const hosts: Host[] = []
  let globalIndex = 0

  for (let i = 0; i < belmopanCount; i++) {
    globalIndex += 1
    hosts.push(
      createHost({
        globalIndex,
        id: `gen-belmopan-${String(i + 1).padStart(2, '0')}`,
        location: 'Belmopan',
        district: 'Cayo',
        center: BELMOPAN_CENTER,
        spreadKm: 6,
        slot: i,
      }),
    )
  }

  for (const district of BELIZE_DISTRICTS) {
    const config = DISTRICT_CONFIG[district]

    for (let i = 0; i < perDistrict; i++) {
      globalIndex += 1
      const slug = district.toLowerCase().replace(/\s+/g, '-')
      hosts.push(
        createHost({
          globalIndex,
          id: `gen-${slug}-${String(i + 1).padStart(2, '0')}`,
          location: config.areas[i % config.areas.length],
          district,
          center: config.center,
          spreadKm: config.spreadKm,
          slot: i,
        }),
      )
    }
  }

  return hosts
}

export const GENERATED_SEED_HOSTS = generateSeedHosts()

export function isGeneratedHostUserId(hostUserId?: string): boolean {
  return hostUserId?.startsWith('gen-host-') ?? false
}

export const GENERATED_HOST_COUNT = GENERATED_SEED_HOSTS.length
export const GENERATED_HOSTS_PER_DISTRICT = SCATTERED_PER_DISTRICT
export const BELMOPAN_GENERATED_HOST_COUNT = BELMOPAN_HOST_COUNT

export function countGeneratedHostsInBelmopan(): number {
  return GENERATED_SEED_HOSTS.filter((h) => h.location === 'Belmopan').length
}
