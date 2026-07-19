import AsyncStorage from '@react-native-async-storage/async-storage'
import { SEED_DATA_VERSION } from '../data/seedData'
import {
  SEED_VERIFICATION_CODES,
  type VerificationCodeRecord,
  type VerificationCodeStatus,
} from './verificationCodes'

export type { VerificationCodeRecord, VerificationCodeStatus } from './verificationCodes'

const CODES_KEY = 'laundry-buddy-verification-codes'
const CODES_VERSION_KEY = 'laundry-buddy-verification-codes-version'

function buildSeedRecords(): VerificationCodeRecord[] {
  return SEED_VERIFICATION_CODES.map((code) => ({ code, status: 'available' }))
}

async function seedCodesIfNeeded(): Promise<VerificationCodeRecord[]> {
  const storedVersion = await AsyncStorage.getItem(CODES_VERSION_KEY)
  if (storedVersion !== SEED_DATA_VERSION) {
    const seeded = buildSeedRecords()
    await AsyncStorage.setItem(CODES_KEY, JSON.stringify(seeded))
    await AsyncStorage.setItem(CODES_VERSION_KEY, SEED_DATA_VERSION)
    return seeded
  }

  const raw = await AsyncStorage.getItem(CODES_KEY)
  if (!raw) {
    const seeded = buildSeedRecords()
    await AsyncStorage.setItem(CODES_KEY, JSON.stringify(seeded))
    return seeded
  }
  return JSON.parse(raw) as VerificationCodeRecord[]
}

async function writeCodes(codes: VerificationCodeRecord[]) {
  await AsyncStorage.setItem(CODES_KEY, JSON.stringify(codes))
}

export async function getAllVerificationCodes(): Promise<VerificationCodeRecord[]> {
  return seedCodesIfNeeded()
}

export async function getAssignedCodeForUser(userId: string): Promise<VerificationCodeRecord | null> {
  const codes = await seedCodesIfNeeded()
  return codes.find((entry) => entry.assignedUserId === userId && entry.status !== 'available') ?? null
}

export async function assignVerificationCode(userId: string, userName: string): Promise<string | null> {
  const codes = await seedCodesIfNeeded()
  const existing = codes.find((entry) => entry.assignedUserId === userId && entry.status === 'assigned')
  if (existing) return existing.code

  const next = codes.find((entry) => entry.status === 'available')
  if (!next) return null

  next.status = 'assigned'
  next.assignedUserId = userId
  next.assignedUserName = userName
  next.assignedAt = new Date().toISOString()
  await writeCodes(codes)
  return next.code
}

export async function markVerificationCodeUsed(userId: string, code: string): Promise<boolean> {
  const codes = await seedCodesIfNeeded()
  const entry = codes.find(
    (item) => item.code === code && item.assignedUserId === userId && item.status === 'assigned',
  )
  if (!entry) return false
  entry.status = 'used'
  entry.usedAt = new Date().toISOString()
  await writeCodes(codes)
  return true
}

export async function releaseVerificationCode(userId: string) {
  const codes = await seedCodesIfNeeded()
  const entry = codes.find((item) => item.assignedUserId === userId && item.status === 'assigned')
  if (!entry) return
  entry.status = 'available'
  delete entry.assignedUserId
  delete entry.assignedUserName
  delete entry.assignedAt
  await writeCodes(codes)
}

export async function countCodesByStatus(): Promise<Record<VerificationCodeStatus, number>> {
  const codes = await seedCodesIfNeeded()
  return codes.reduce(
    (acc, entry) => {
      acc[entry.status] += 1
      return acc
    },
    { available: 0, assigned: 0, used: 0 } as Record<VerificationCodeStatus, number>,
  )
}
