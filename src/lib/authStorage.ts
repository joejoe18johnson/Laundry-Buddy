import AsyncStorage from '@react-native-async-storage/async-storage'
import type { User } from '../types'
import { SEED_DATA_VERSION, SEED_USERS } from '../data/seedData'
import { normalizeUserIdentity } from './identityVerification'
import { normalizePhone } from './phone'

const USERS_KEY = 'laundry-buddy-users'
const SESSION_KEY = 'laundry-buddy-session'
const VERSION_KEY = 'laundry-buddy-data-version'

async function seedUsersIfNeeded(): Promise<User[]> {
  const storedVersion = await AsyncStorage.getItem(VERSION_KEY)
  if (storedVersion !== SEED_DATA_VERSION) {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS))
    await AsyncStorage.setItem(VERSION_KEY, SEED_DATA_VERSION)
    return SEED_USERS
  }

  const raw = await AsyncStorage.getItem(USERS_KEY)
  if (!raw) {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS))
    return SEED_USERS
  }
  return JSON.parse(raw) as User[]
}

function normalizeUsers(users: User[]): User[] {
  return users.map(normalizeUserIdentity)
}

async function readUsers(): Promise<User[]> {
  const users = await seedUsersIfNeeded()
  return normalizeUsers(users)
}

async function writeUsers(users: User[]) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export async function getSessionUserId(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_KEY)
}

export async function setSessionUserId(id: string | null) {
  if (id) await AsyncStorage.setItem(SESSION_KEY, id)
  else await AsyncStorage.removeItem(SESSION_KEY)
}

export async function getCurrentUser(): Promise<User | null> {
  const id = await getSessionUserId()
  if (!id) return null
  return getUserById(id)
}

export async function getAllUsers(): Promise<User[]> {
  return readUsers()
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await readUsers()
  return users.find((u) => u.id === id) ?? null
}

export async function saveUser(user: User) {
  const users = await readUsers()
  const index = users.findIndex((u) => u.id === user.id)
  if (index >= 0) users[index] = user
  else users.push(user)
  await writeUsers(users)
}

export async function findUserByPhone(phone: string): Promise<User | undefined> {
  const normalized = normalizePhone(phone)
  const users = await readUsers()
  return users.find((u) => u.phone && normalizePhone(u.phone) === normalized)
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const normalized = email.trim().toLowerCase()
  const users = await readUsers()
  return users.find((u) => u.email?.toLowerCase() === normalized)
}

export async function phoneInUse(phone: string): Promise<boolean> {
  return !!(await findUserByPhone(phone))
}

export async function emailInUse(email: string): Promise<boolean> {
  return !!(await findUserByEmail(email))
}

export async function resetTrainingData() {
  await AsyncStorage.multiRemove([USERS_KEY, VERSION_KEY, SESSION_KEY])
  await seedUsersIfNeeded()
}
