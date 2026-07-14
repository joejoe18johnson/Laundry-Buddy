import type { Host } from '../types'
import { BELIZE_DISTRICTS, type BelizeDistrict } from '../lib/belizeDistricts'

const HOSTS_PER_DISTRICT = 12

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
}

const DISTRICT_CONFIG: Record<BelizeDistrict, DistrictSeedConfig> = {
  Belize: {
    center: { latitude: 17.499, longitude: -88.188 },
    areas: [
      'Belize City', 'Ladyville', 'Hattieville', 'San Pedro', 'Caye Caulker',
      'Burrell Boom', 'Gracie Rock', 'Freetown', 'Port Loyola', 'Kings Park',
      'Belama', 'Collet',
    ],
  },
  Cayo: {
    center: { latitude: 17.156, longitude: -89.069 },
    areas: [
      'San Ignacio', 'Santa Elena', 'UB Area', 'Las Flores', 'Maya Mopan',
      'Cristo Rey', 'Bullet Tree', 'Esperanza', 'Georgeville', 'Succotz',
      'Camalote', 'Teakettle',
    ],
  },
  Corozal: {
    center: { latitude: 18.393, longitude: -88.388 },
    areas: [
      'Corozal Town', 'Concepcion', 'San Narciso', 'San Victor', 'Calcutta',
      'Patchakan', 'San Joaquin', 'Progresso', 'Copper Bank', 'Sarteneja',
      'Chunox', 'Little Belize',
    ],
  },
  'Orange Walk': {
    center: { latitude: 18.075, longitude: -88.56 },
    areas: [
      'Orange Walk Town', 'San Estevan', 'San Pablo', 'San Jose', 'San Roman',
      'San Fernando', 'Trial Farm', 'Guinea Grass', 'Shipyard', 'Yo Creek',
      'San Carlos', 'Indian Church',
    ],
  },
  'Stann Creek': {
    center: { latitude: 16.969, longitude: -88.233 },
    areas: [
      'Dangriga', 'Hopkins', 'Placencia', 'Seine Bight', 'Maya Beach',
      'Independence', 'Mango Creek', 'Red Bank', 'Sittee River', 'Alta Vista',
      'Georgetown', 'Golden Stream',
    ],
  },
  Toledo: {
    center: { latitude: 16.098, longitude: -88.81 },
    areas: [
      'Punta Gorda', 'San Antonio', 'Big Falls', 'San Pedro Columbia', 'Blue Creek',
      'Jalacte', 'Silver Creek', 'Monkey River', 'Barranco', 'San Miguel',
      'Indian Creek', 'Crique Sarco',
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
  const distanceKm = 0.5 + ((index * 0.83) % maxSpreadKm)
  const latRad = (center.latitude * Math.PI) / 180
  const latitude = center.latitude + (distanceKm / 111.32) * Math.cos(angle)
  const longitude =
    center.longitude + (distanceKm / (111.32 * Math.cos(latRad))) * Math.sin(angle)
  return {
    latitude: Math.round(latitude * 10000) / 10000,
    longitude: Math.round(longitude * 10000) / 10000,
  }
}

function districtHostId(district: BelizeDistrict, index: number): string {
  const slug = district.toLowerCase().replace(/\s+/g, '-')
  return `gen-${slug}-${String(index + 1).padStart(2, '0')}`
}

function districtHostUserId(globalIndex: number): string {
  return `gen-host-${String(globalIndex).padStart(3, '0')}`
}

/** Generate seeded hosts evenly across all six Belize districts. */
export function generateSeedHosts(perDistrict = HOSTS_PER_DISTRICT): Host[] {
  const hosts: Host[] = []
  let globalIndex = 0

  for (const district of BELIZE_DISTRICTS) {
    const config = DISTRICT_CONFIG[district]
    const spreadKm = district === 'Cayo' ? 18 : district === 'Belize' ? 22 : 28

    for (let i = 0; i < perDistrict; i++) {
      globalIndex += 1
      const name = FIRST_NAMES[(globalIndex + i) % FIRST_NAMES.length]
      const location = config.areas[i % config.areas.length]
      const { latitude, longitude } = coordAroundCenter(config.center, i + 1, spreadKm)
      const price = [0, 0, 3, 4, 5, 6][globalIndex % 6]
      const foldingPrice = price === 0 ? 2 : [0, 3, 4, 5][globalIndex % 4]
      const rating = globalIndex % 7 === 0 ? 0 : 3.8 + (globalIndex % 12) * 0.1

      hosts.push({
        id: districtHostId(district, i),
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
      })
    }
  }

  return hosts
}

export const GENERATED_SEED_HOSTS = generateSeedHosts(HOSTS_PER_DISTRICT)

export function isGeneratedHostUserId(hostUserId?: string): boolean {
  return hostUserId?.startsWith('gen-host-') ?? false
}

export const GENERATED_HOST_COUNT = GENERATED_SEED_HOSTS.length
export const GENERATED_HOSTS_PER_DISTRICT = HOSTS_PER_DISTRICT
