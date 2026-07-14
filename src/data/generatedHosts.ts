import type { Host } from '../types'
import { USER_LOCATION } from '../lib/mapRegion'

const CENTER = USER_LOCATION

const FIRST_NAMES = [
  'Sofia', 'Diego', 'Rosa', 'Carlos', 'Elena', 'Marco', 'Ana', 'Luis',
  'Gabriela', 'Jorge', 'Patricia', 'Ramon', 'Isabel', 'Oscar', 'Teresa',
  'Felipe', 'Nina', 'Hector', 'Valeria', 'Andres', 'Camila', 'Ricardo',
  'Daniela', 'Pablo', 'Monica', 'Sergio', 'Laura', 'Victor', 'Adriana',
  'Miguel', 'Claudia', 'Eduardo', 'Beatriz', 'Fernando', 'Silvia',
  'Antonio', 'Mariana', 'Roberto', 'Lucia', 'Javier', 'Carmen', 'Pedro',
]

const AREAS = [
  'San Ignacio', 'Santa Elena', 'UB Area', 'Las Flores', 'Maya Mopan',
  'Cristo Rey', 'Bullet Tree', 'Esperanza', 'Georgeville', 'Succotz',
  'Camalote', 'Teakettle', 'Billy White', 'Branch Mouth', 'Roaring Creek',
  'San Antonio', 'Unitedville', 'Blackman Eddy', 'Ontario', 'Burrell Boom Rd',
]

const DRYER_TYPES = ['Electric', 'Gas', 'Electric', 'Electric', 'Gas']

function coordAt(index: number, maxKm: number): { latitude: number; longitude: number; distanceKm: number } {
  const angleDeg = (index * 137.508) % 360
  const angle = (angleDeg * Math.PI) / 180
  const distanceKm = 0.4 + ((index * 0.71) % maxKm)
  const latRad = (CENTER.latitude * Math.PI) / 180
  const latitude = CENTER.latitude + (distanceKm / 111.32) * Math.cos(angle)
  const longitude =
    CENTER.longitude + (distanceKm / (111.32 * Math.cos(latRad))) * Math.sin(angle)
  return {
    latitude: Math.round(latitude * 10000) / 10000,
    longitude: Math.round(longitude * 10000) / 10000,
    distanceKm: Math.round(distanceKm * 10) / 10,
  }
}

/** ~42 extra hosts around Cayo for map density testing (50 total with hand-seeded hosts). */
export function generateSeedHosts(count = 42, maxSpreadKm = 18): Host[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1
    const id = `gen-${String(n).padStart(3, '0')}`
    const name = FIRST_NAMES[i % FIRST_NAMES.length]
    const location = AREAS[i % AREAS.length]
    const { latitude, longitude, distanceKm } = coordAt(i + 1, maxSpreadKm)
    const price = [0, 0, 3, 4, 5, 6][i % 6]
    const foldingPrice = price === 0 ? 2 : [0, 3, 4, 5][i % 4]
    const rating = i % 7 === 0 ? 0 : 3.8 + (i % 12) * 0.1
    const slotsLeft = 1 + (i % 4)

    return {
      id,
      hostUserId: `gen-host-${String(n).padStart(3, '0')}`,
      name: n > FIRST_NAMES.length ? `${name} ${Math.floor(n / FIRST_NAMES.length) + 1}` : name,
      location,
      district: 'Cayo',
      distanceKm,
      rating: Math.min(5, Math.round(rating * 10) / 10),
      reviewCount: rating > 0 ? 3 + (i % 40) : 0,
      price,
      foldingPrice,
      sheetsPrice: 1 + (i % 2),
      slotsLeft,
      turnaroundHours: 2 + (i % 4),
      dryerType: DRYER_TYPES[i % DRYER_TYPES.length],
      hasGenerator: i % 3 === 0,
      address: `${10 + (i % 80)} ${location} Rd.`,
      gateCode: String(1000 + ((i * 137) % 9000)),
      whatsapp: `501600${String(2000 + n).slice(-4)}`,
      latitude,
      longitude,
      photos: ['Home dryer setup', 'Drop-off area'],
      rules: ['Text before drop-off', 'Pick up within 24 hrs'],
    } satisfies Host
  })
}

export const GENERATED_SEED_HOSTS = generateSeedHosts()

export function isGeneratedHostUserId(hostUserId?: string): boolean {
  return hostUserId?.startsWith('gen-host-') ?? false
}
