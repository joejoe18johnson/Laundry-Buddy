import type { User } from '../types'
import { normalizePhone } from './phone'

const USERS_KEY = 'laundry-buddy-users'
const SESSION_KEY = 'laundry-buddy-session'

const SEED_USERS: User[] = [
  {
    id: 'user-ana',
    name: 'Ana',
    phone: '5016001111',
    password: 'demo1234',
    role: 'customer',
  },
  {
    id: 'user-maria',
    name: 'Maria',
    email: 'maria@example.com',
    phone: '5016001234',
    password: 'demo1234',
    role: 'host',
    hostVerification: {
      status: 'verified',
      idUploaded: true,
      addressUploaded: true,
      address: '22 Coconut St., Las Flores, Belmopan',
      submittedAt: '2026-07-01T10:00:00.000Z',
    },
  },
]

function readUsers(): User[] {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS))
    return SEED_USERS
  }
  return JSON.parse(raw) as User[]
}

function writeUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getSessionUserId(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

export function setSessionUserId(id: string | null) {
  if (id) localStorage.setItem(SESSION_KEY, id)
  else localStorage.removeItem(SESSION_KEY)
}

export function getCurrentUser(): User | null {
  const id = getSessionUserId()
  if (!id) return null
  return readUsers().find((u) => u.id === id) ?? null
}

export function saveUser(user: User) {
  const users = readUsers()
  const index = users.findIndex((u) => u.id === user.id)
  if (index >= 0) users[index] = user
  else users.push(user)
  writeUsers(users)
}

export function findUserByPhone(phone: string): User | undefined {
  const normalized = normalizePhone(phone)
  return readUsers().find((u) => u.phone && normalizePhone(u.phone) === normalized)
}

export function findUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase()
  return readUsers().find((u) => u.email?.toLowerCase() === normalized)
}

export function phoneInUse(phone: string): boolean {
  return !!findUserByPhone(phone)
}

export function emailInUse(email: string): boolean {
  return !!findUserByEmail(email)
}
