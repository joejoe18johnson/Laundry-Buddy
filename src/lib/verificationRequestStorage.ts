import AsyncStorage from '@react-native-async-storage/async-storage'
import { SEED_DATA_VERSION } from '../data/seedData'

const REQUESTS_KEY = 'laundry-buddy-verification-requests'
const REQUESTS_VERSION_KEY = 'laundry-buddy-verification-requests-version'

export type VerificationCodeRequestStatus = 'pending' | 'code_sent' | 'completed'

export type VerificationCodeRequest = {
  id: string
  userId: string
  userName: string
  phone: string
  requestedAt: string
  status: VerificationCodeRequestStatus
  assignedCode?: string
  codeSentAt?: string
  completedAt?: string
}

async function readRequests(): Promise<VerificationCodeRequest[]> {
  const storedVersion = await AsyncStorage.getItem(REQUESTS_VERSION_KEY)
  if (storedVersion !== SEED_DATA_VERSION) {
    await AsyncStorage.multiRemove([REQUESTS_KEY, REQUESTS_VERSION_KEY])
    await AsyncStorage.setItem(REQUESTS_VERSION_KEY, SEED_DATA_VERSION)
    return []
  }

  const raw = await AsyncStorage.getItem(REQUESTS_KEY)
  if (!raw) return []
  return JSON.parse(raw) as VerificationCodeRequest[]
}

async function writeRequests(requests: VerificationCodeRequest[]) {
  await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(requests))
  await AsyncStorage.setItem(REQUESTS_VERSION_KEY, SEED_DATA_VERSION)
}

export async function getVerificationCodeRequestForUser(
  userId: string,
): Promise<VerificationCodeRequest | null> {
  const requests = await readRequests()
  return (
    requests.find((entry) => entry.userId === userId && entry.status !== 'completed') ?? null
  )
}

export async function getPendingVerificationCodeRequests(): Promise<VerificationCodeRequest[]> {
  const requests = await readRequests()
  return requests
    .filter((entry) => entry.status === 'pending')
    .sort((a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt))
}

export async function getActiveVerificationCodeRequests(): Promise<VerificationCodeRequest[]> {
  const requests = await readRequests()
  return requests
    .filter((entry) => entry.status === 'pending' || entry.status === 'code_sent')
    .sort((a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt))
}

export async function createVerificationCodeRequest(
  userId: string,
  userName: string,
  phone: string,
): Promise<VerificationCodeRequest> {
  const requests = await readRequests()
  const existing = requests.find((entry) => entry.userId === userId && entry.status !== 'completed')
  if (existing) return existing

  const request: VerificationCodeRequest = {
    id: `vreq-${Date.now()}`,
    userId,
    userName,
    phone,
    requestedAt: new Date().toISOString(),
    status: 'pending',
  }
  requests.unshift(request)
  await writeRequests(requests)
  return request
}

export async function markVerificationCodeSent(
  userId: string,
  code: string,
): Promise<VerificationCodeRequest | null> {
  const requests = await readRequests()
  const entry = requests.find((item) => item.userId === userId && item.status !== 'completed')
  if (!entry) return null
  entry.status = 'code_sent'
  entry.assignedCode = code
  entry.codeSentAt = new Date().toISOString()
  await writeRequests(requests)
  return entry
}

export async function completeVerificationCodeRequest(userId: string): Promise<void> {
  const requests = await readRequests()
  const entry = requests.find((item) => item.userId === userId && item.status !== 'completed')
  if (!entry) return
  entry.status = 'completed'
  entry.completedAt = new Date().toISOString()
  await writeRequests(requests)
}
