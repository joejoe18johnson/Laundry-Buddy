import type { Host } from '../types'
import { BELIZE_DISTRICTS, type BelizeDistrict } from '../lib/belizeDistricts'
import { TURNAROUND_HOUR_OPTIONS } from '../lib/turnaroundTime'
import { BELIZE_VILLAGES, type BelizeVillage } from './belizeVillages'

/** Extra Belmopan-area hosts for demo density (coordinates jittered near capital). */
const BELMOPAN_EXTRA_COUNT = 12

const BELMOPAN_CENTER = { latitude: 17.251, longitude: -88.759 }

const FIRST_NAMES = [
  'Sofia', 'Diego', 'Rosa', 'Carlos', 'Elena', 'Marco', 'Ana', 'Luis',
  'Gabriela', 'Jorge', 'Patricia', 'Ramon', 'Isabel', 'Oscar', 'Teresa',
  'Felipe', 'Nina', 'Hector', 'Valeria', 'Andres', 'Camila', 'Ricardo',
  'Daniela', 'Pablo', 'Monica', 'Sergio', 'Laura', 'Victor', 'Adriana',
  'Miguel', 'Claudia', 'Eduardo', 'Beatriz', 'Fernando', 'Silvia',
  'Antonio', 'Mariana', 'Roberto', 'Lucia', 'Javier', 'Carmen', 'Pedro',
  'Ines', 'Raul', 'Gloria', 'Emilio', 'Diana', 'Arturo', 'Olga', 'Manuel',
]

const DRYER_TYPES = ['Electric', 'Gas', 'Electric', 'Electric', 'Gas']

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function districtHostUserId(globalIndex: number): string {
  return `gen-host-${String(globalIndex).padStart(3, '0')}`
}

function jitterCoord(
  latitude: number,
  longitude: number,
  index: number,
  spreadKm: number,
): { latitude: number; longitude: number } {
  const angleDeg = (index * 137.508) % 360
  const angle = (angleDeg * Math.PI) / 180
  const distanceKm = 0.15 + ((index * 0.43) % spreadKm)
  const latRad = (latitude * Math.PI) / 180
  const lat = latitude + (distanceKm / 111.32) * Math.cos(angle)
  const lng = longitude + (distanceKm / (111.32 * Math.cos(latRad))) * Math.sin(angle)
  return {
    latitude: Math.round(lat * 10000) / 10000,
    longitude: Math.round(lng * 10000) / 10000,
  }
}

type HostSeedInput = {
  globalIndex: number
  id: string
  village: BelizeVillage
  slot: number
  spreadKm?: number
}

function createHost(input: HostSeedInput): Host {
  const { globalIndex, id, village, slot, spreadKm = 1.2 } = input
  const name = FIRST_NAMES[(globalIndex + slot) % FIRST_NAMES.length]
  const { latitude, longitude } = jitterCoord(village.latitude, village.longitude, slot, spreadKm)
  const price = [3, 4, 5, 6, 4, 5][globalIndex % 6]
  const foldingPrice = [0, 2, 3, 4][globalIndex % 4]
  const rating = globalIndex % 7 === 0 ? 0 : 3.8 + (globalIndex % 12) * 0.1

  return {
    id,
    hostUserId: districtHostUserId(globalIndex),
    name: globalIndex > FIRST_NAMES.length ? `${name} ${Math.floor(globalIndex / FIRST_NAMES.length)}` : name,
    location: village.name,
    district: village.district,
    rating: Math.min(5, Math.round(rating * 10) / 10),
    reviewCount: rating > 0 ? 3 + (globalIndex % 40) : 0,
    price,
    foldingPrice,
    sheetsPrice: 1,
    slotsLeft: 1 + (globalIndex % 4),
    turnaroundHours: TURNAROUND_HOUR_OPTIONS[globalIndex % TURNAROUND_HOUR_OPTIONS.length],
    dryerType: DRYER_TYPES[globalIndex % DRYER_TYPES.length],
    hasGenerator: globalIndex % 3 === 0,
    address: `${10 + (globalIndex % 80)} ${village.name} Rd., ${village.district}`,
    gateCode: String(1000 + ((globalIndex * 137) % 9000)),
    whatsapp: `501600${String(2000 + globalIndex).slice(-4)}`,
    latitude,
    longitude,
    photos: ['Home dryer setup', 'Drop-off area'],
    rules: ['Text before drop-off', 'Pick up within 24 hrs'],
  }
}

/** One host per village nationwide, plus extra Belmopan cluster for demo. */
export function generateSeedHosts(belmopanExtra = BELMOPAN_EXTRA_COUNT): Host[] {
  const hosts: Host[] = []
  let globalIndex = 0

  for (const village of BELIZE_VILLAGES) {
    globalIndex += 1
    const districtSlug = slugify(village.district)
    const villageSlug = slugify(village.name)
    hosts.push(
      createHost({
        globalIndex,
        id: `gen-${districtSlug}-${villageSlug}`,
        village,
        slot: globalIndex,
        spreadKm: village.name === 'Belmopan' ? 2.5 : 1.5,
      }),
    )
  }

  for (let i = 0; i < belmopanExtra; i++) {
    globalIndex += 1
    hosts.push(
      createHost({
        globalIndex,
        id: `gen-belmopan-extra-${String(i + 1).padStart(2, '0')}`,
        village: {
          name: 'Belmopan',
          district: 'Cayo',
          latitude: BELMOPAN_CENTER.latitude,
          longitude: BELMOPAN_CENTER.longitude,
        },
        slot: i + 100,
        spreadKm: 4,
      }),
    )
  }

  return hosts
}

export const GENERATED_SEED_HOSTS = generateSeedHosts()

export function isGeneratedHostUserId(hostUserId?: string): boolean {
  return hostUserId?.startsWith('gen-host-') ?? false
}

export const GENERATED_HOST_COUNT = GENERATED_SEED_HOSTS.length
export const BELMOPAN_GENERATED_HOST_COUNT = GENERATED_SEED_HOSTS.filter(
  (h) => h.location === 'Belmopan',
).length

export function countGeneratedHostsInBelmopan(): number {
  return BELMOPAN_GENERATED_HOST_COUNT
}

export function countGeneratedHostsInDistrict(district: BelizeDistrict): number {
  return GENERATED_SEED_HOSTS.filter((h) => h.district === district).length
}

export function listGeneratedVillages(): string[] {
  return [...new Set(GENERATED_SEED_HOSTS.map((h) => h.location))].sort()
}

/** @deprecated Use village-based generation — kept for tests / docs. */
export const GENERATED_HOSTS_PER_DISTRICT = Math.max(
  ...BELIZE_DISTRICTS.map((d) => countGeneratedHostsInDistrict(d)),
)
