import type { BelizeDistrict } from '../lib/belizeDistricts'

export type BelizeVillage = {
  name: string
  district: BelizeDistrict
  latitude: number
  longitude: number
}

/** Towns and villages across all six districts — one host per entry in seed data. */
export const BELIZE_VILLAGES: BelizeVillage[] = [
  // Cayo
  { name: 'Belmopan', district: 'Cayo', latitude: 17.251, longitude: -88.759 },
  { name: 'San Ignacio', district: 'Cayo', latitude: 17.156, longitude: -89.069 },
  { name: 'Santa Elena', district: 'Cayo', latitude: 17.151, longitude: -89.064 },
  { name: 'Las Flores', district: 'Cayo', latitude: 17.158, longitude: -89.072 },
  { name: 'Teakettle', district: 'Cayo', latitude: 17.217, longitude: -88.833 },
  { name: 'Roaring Creek', district: 'Cayo', latitude: 17.198, longitude: -88.892 },
  { name: 'Georgeville', district: 'Cayo', latitude: 17.123, longitude: -89.127 },
  { name: 'Bullet Tree', district: 'Cayo', latitude: 17.194, longitude: -89.098 },
  { name: 'Esperanza', district: 'Cayo', latitude: 17.142, longitude: -89.142 },
  { name: 'Succotz', district: 'Cayo', latitude: 17.078, longitude: -89.089 },
  { name: 'Spanish Lookout', district: 'Cayo', latitude: 17.186, longitude: -89.035 },
  { name: 'Camalote', district: 'Cayo', latitude: 17.235, longitude: -88.912 },
  { name: 'Blackman Eddy', district: 'Cayo', latitude: 17.218, longitude: -88.972 },
  { name: 'Ontario', district: 'Cayo', latitude: 17.268, longitude: -88.818 },
  { name: 'Unitedville', district: 'Cayo', latitude: 17.289, longitude: -88.861 },
  { name: 'Armenia', district: 'Cayo', latitude: 17.312, longitude: -88.798 },
  { name: 'More Tomorrow', district: 'Cayo', latitude: 17.198, longitude: -88.768 },
  { name: 'Billy White', district: 'Cayo', latitude: 17.172, longitude: -88.812 },
  { name: 'Branch Mouth', district: 'Cayo', latitude: 17.241, longitude: -88.721 },
  { name: 'Salvapan', district: 'Cayo', latitude: 17.264, longitude: -88.742 },

  // Belize District
  { name: 'Belize City', district: 'Belize', latitude: 17.499, longitude: -88.188 },
  { name: 'Ladyville', district: 'Belize', latitude: 17.554, longitude: -88.194 },
  { name: 'Hattieville', district: 'Belize', latitude: 17.544, longitude: -88.104 },
  { name: 'Burrell Boom', district: 'Belize', latitude: 17.568, longitude: -88.402 },
  { name: 'Sand Hill', district: 'Belize', latitude: 17.612, longitude: -88.312 },
  { name: 'Maskall', district: 'Belize', latitude: 17.632, longitude: -88.362 },
  { name: 'Gracie Rock', district: 'Belize', latitude: 17.478, longitude: -88.248 },
  { name: 'Freetown', district: 'Belize', latitude: 17.492, longitude: -88.212 },
  { name: 'Port Loyola', district: 'Belize', latitude: 17.508, longitude: -88.178 },
  { name: 'Kings Park', district: 'Belize', latitude: 17.486, longitude: -88.202 },
  { name: 'San Pedro', district: 'Belize', latitude: 17.921, longitude: -87.961 },
  { name: 'Caye Caulker', district: 'Belize', latitude: 17.761, longitude: -88.028 },
  { name: 'Lucky Strike', district: 'Belize', latitude: 17.518, longitude: -88.352 },
  { name: 'Lombard', district: 'Belize', latitude: 17.538, longitude: -88.322 },
  { name: 'Bermudian Landing', district: 'Belize', latitude: 17.548, longitude: -88.432 },
  { name: 'Gales Point', district: 'Belize', latitude: 17.182, longitude: -88.532 },
  { name: 'La Democracia', district: 'Belize', latitude: 17.218, longitude: -88.552 },
  { name: 'Willows Bank', district: 'Belize', latitude: 17.582, longitude: -88.452 },

  // Corozal
  { name: 'Corozal Town', district: 'Corozal', latitude: 18.393, longitude: -88.388 },
  { name: 'Concepcion', district: 'Corozal', latitude: 18.362, longitude: -88.412 },
  { name: 'San Narciso', district: 'Corozal', latitude: 18.318, longitude: -88.452 },
  { name: 'San Victor', district: 'Corozal', latitude: 18.338, longitude: -88.472 },
  { name: 'Calcutta', district: 'Corozal', latitude: 18.408, longitude: -88.352 },
  { name: 'Patchakan', district: 'Corozal', latitude: 18.428, longitude: -88.372 },
  { name: 'Progresso', district: 'Corozal', latitude: 18.448, longitude: -88.392 },
  { name: 'Copper Bank', district: 'Corozal', latitude: 18.468, longitude: -88.452 },
  { name: 'Sarteneja', district: 'Corozal', latitude: 18.352, longitude: -88.132 },
  { name: 'Chunox', district: 'Corozal', latitude: 18.502, longitude: -88.332 },
  { name: 'Little Belize', district: 'Corozal', latitude: 18.282, longitude: -88.512 },
  { name: 'Louisville', district: 'Corozal', latitude: 18.322, longitude: -88.362 },
  { name: 'Xaibe', district: 'Corozal', latitude: 18.382, longitude: -88.432 },
  { name: 'Caledonia', district: 'Corozal', latitude: 18.412, longitude: -88.462 },
  { name: 'San Joaquin', district: 'Corozal', latitude: 18.372, longitude: -88.482 },

  // Orange Walk
  { name: 'Orange Walk Town', district: 'Orange Walk', latitude: 18.075, longitude: -88.56 },
  { name: 'San Estevan', district: 'Orange Walk', latitude: 18.118, longitude: -88.542 },
  { name: 'San Pablo', district: 'Orange Walk', latitude: 18.098, longitude: -88.582 },
  { name: 'Trial Farm', district: 'Orange Walk', latitude: 18.088, longitude: -88.571 },
  { name: 'Guinea Grass', district: 'Orange Walk', latitude: 17.979, longitude: -88.598 },
  { name: 'Shipyard', district: 'Orange Walk', latitude: 17.918, longitude: -88.652 },
  { name: 'Yo Creek', district: 'Orange Walk', latitude: 18.058, longitude: -88.612 },
  { name: 'San Carlos', district: 'Orange Walk', latitude: 18.138, longitude: -88.592 },
  { name: 'San Jose', district: 'Orange Walk', latitude: 18.158, longitude: -88.622 },
  { name: 'San Roman', district: 'Orange Walk', latitude: 18.178, longitude: -88.642 },
  { name: 'Carmelita', district: 'Orange Walk', latitude: 18.038, longitude: -88.532 },
  { name: 'Indian Church', district: 'Orange Walk', latitude: 17.858, longitude: -88.732 },
  { name: 'San Lazaro', district: 'Orange Walk', latitude: 18.198, longitude: -88.672 },
  { name: 'Doubloon Bank', district: 'Orange Walk', latitude: 17.938, longitude: -88.692 },
  { name: 'San Felipe', district: 'Orange Walk', latitude: 18.018, longitude: -88.652 },

  // Stann Creek
  { name: 'Dangriga', district: 'Stann Creek', latitude: 16.969, longitude: -88.233 },
  { name: 'Hopkins', district: 'Stann Creek', latitude: 16.863, longitude: -88.367 },
  { name: 'Placencia', district: 'Stann Creek', latitude: 16.514, longitude: -88.366 },
  { name: 'Seine Bight', district: 'Stann Creek', latitude: 16.538, longitude: -88.382 },
  { name: 'Maya Beach', district: 'Stann Creek', latitude: 16.548, longitude: -88.372 },
  { name: 'Independence', district: 'Stann Creek', latitude: 16.534, longitude: -88.408 },
  { name: 'Mango Creek', district: 'Stann Creek', latitude: 16.518, longitude: -88.428 },
  { name: 'Red Bank', district: 'Stann Creek', latitude: 16.898, longitude: -88.312 },
  { name: 'Sittee River', district: 'Stann Creek', latitude: 16.928, longitude: -88.272 },
  { name: 'Georgetown', district: 'Stann Creek', latitude: 16.848, longitude: -88.292 },
  { name: 'Mullins River', district: 'Stann Creek', latitude: 16.878, longitude: -88.252 },
  { name: 'Alta Vista', district: 'Stann Creek', latitude: 16.948, longitude: -88.292 },
  { name: 'Pomona', district: 'Stann Creek', latitude: 16.988, longitude: -88.312 },
  { name: 'Silk Grass', district: 'Stann Creek', latitude: 16.918, longitude: -88.332 },
  { name: 'Middlesex', district: 'Stann Creek', latitude: 16.958, longitude: -88.352 },

  // Toledo
  { name: 'Punta Gorda', district: 'Toledo', latitude: 16.098, longitude: -88.81 },
  { name: 'San Antonio', district: 'Toledo', latitude: 16.248, longitude: -88.972 },
  { name: 'Big Falls', district: 'Toledo', latitude: 16.198, longitude: -88.952 },
  { name: 'San Pedro Columbia', district: 'Toledo', latitude: 16.178, longitude: -88.932 },
  { name: 'Blue Creek', district: 'Toledo', latitude: 17.078, longitude: -89.012 },
  { name: 'Jalacte', district: 'Toledo', latitude: 16.148, longitude: -88.892 },
  { name: 'Silver Creek', district: 'Toledo', latitude: 16.218, longitude: -88.872 },
  { name: 'Monkey River', district: 'Toledo', latitude: 16.348, longitude: -88.652 },
  { name: 'Barranco', district: 'Toledo', latitude: 16.028, longitude: -88.932 },
  { name: 'San Miguel', district: 'Toledo', latitude: 16.168, longitude: -88.852 },
  { name: 'Indian Creek', district: 'Toledo', latitude: 16.128, longitude: -88.832 },
  { name: 'Graham Creek', district: 'Toledo', latitude: 16.108, longitude: -88.872 },
  { name: 'Toledo Settlement', district: 'Toledo', latitude: 16.078, longitude: -88.852 },
  { name: 'Crique Sarco', district: 'Toledo', latitude: 16.058, longitude: -88.892 },
  { name: 'Golden Stream', district: 'Toledo', latitude: 16.268, longitude: -88.832 },
]

export function villagesInDistrict(district: BelizeDistrict): BelizeVillage[] {
  return BELIZE_VILLAGES.filter((v) => v.district === district)
}

export function villageCountByDistrict(): Record<BelizeDistrict, number> {
  const counts = {} as Record<BelizeDistrict, number>
  for (const village of BELIZE_VILLAGES) {
    counts[village.district] = (counts[village.district] ?? 0) + 1
  }
  return counts
}
