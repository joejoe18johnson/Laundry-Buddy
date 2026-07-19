import type { User, VerificationStatus } from '../types'
import { getAllUsers, getUserById, saveUser } from './authStorage'
import {
  getIdentityVerification,
  hasAddressProof,
  mergeUserProfiles,
  normalizeUserIdentity,
} from './identityVerification'
import { isSupabaseConfigured } from './supabase'
import { fetchProfileById } from './supabase/authService'
import { getSupabaseClient } from './supabase/client'
import { adminPatchIdentityVerification, fetchProfileVerificationAfterPatch } from './supabase/verificationService'
import { identityVerificationToJson, profileRowToUser } from './supabase/mappers'

export type AdminUserActionResult = {
  user: User | null
  error?: string
}

/** Best-effort timestamp for admin lists — prefers profile created_at, then verification activity. */
export function getUserSortTime(user: User): number {
  if (user.createdAt) {
    const parsed = Date.parse(user.createdAt)
    if (!Number.isNaN(parsed)) return parsed
  }

  const verification = getIdentityVerification(user)
  for (const iso of [verification.submittedAt, verification.codeRequestedAt]) {
    if (!iso) continue
    const parsed = Date.parse(iso)
    if (!Number.isNaN(parsed)) return parsed
  }

  const fromId = user.id.match(/(\d{10,})/)
  if (fromId) {
    const parsed = Number(fromId[1])
    if (!Number.isNaN(parsed)) return parsed
  }

  return 0
}

export function sortUsersNewestFirst(users: User[]): User[] {
  return [...users].sort((a, b) => getUserSortTime(b) - getUserSortTime(a))
}

function verificationChanged(before: User, after: User): boolean {
  return (
    getIdentityVerification(before).status !== getIdentityVerification(after).status ||
    JSON.stringify(getIdentityVerification(before)) !== JSON.stringify(getIdentityVerification(after))
  )
}

async function cacheResolvedUser(user: User, local: User | null): Promise<User> {
  if (!local || verificationChanged(local, user)) {
    await saveUser(user)
  }
  return user
}

/** Resolve a user from local cache and Supabase, preferring the latest verification state. */
export async function resolveUserById(userId: string): Promise<User | null> {
  const local = await getUserById(userId)

  if (!isSupabaseConfigured()) {
    return local
  }

  let remote: User | null = null
  try {
    remote = await fetchProfileById(userId)
  } catch {
    remote = null
  }

  if (local && remote) {
    return cacheResolvedUser(mergeUserProfiles(remote, local), local)
  }

  if (remote) {
    return cacheResolvedUser(remote, local)
  }

  return local
}

export async function getAdminUsers(): Promise<User[]> {
  const users = await listAllUsers()
  return users.filter((entry) => entry.role === 'admin')
}

export async function listAllUsers(): Promise<User[]> {
  const localUsers = await getAllUsers()

  if (!isSupabaseConfigured()) {
    return sortUsersNewestFirst(localUsers)
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return sortUsersNewestFirst(localUsers)
  }

  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error || !data) {
    return sortUsersNewestFirst(localUsers)
  }

  const merged = new Map<string, User>()
  for (const entry of data.map(profileRowToUser)) {
    merged.set(entry.id, entry)
  }
  for (const entry of localUsers) {
    const remote = merged.get(entry.id)
    merged.set(entry.id, remote ? mergeUserProfiles(remote, entry) : entry)
  }

  return sortUsersNewestFirst(Array.from(merged.values()))
}

export async function getAdminUserById(userId: string): Promise<User | null> {
  return resolveUserById(userId)
}

export function usersPendingIdReview(users: User[]): User[] {
  return sortUsersNewestFirst(
    users.filter((entry) => {
      const verification = getIdentityVerification(entry)
      if (verification.status !== 'pending' || !verification.idUploaded) return false
      if (!verification.phoneVerified) return false
      if (entry.role === 'host') {
        return hasAddressProof(verification)
      }
      return true
    }),
  )
}

export async function markPhoneVerifiedForUser(userId: string, phone?: string): Promise<User | null> {
  const user = await resolveUserById(userId)
  if (!user) return null

  const current = getIdentityVerification(user)
  const verification = {
    ...current,
    phoneVerified: true,
    verifiedPhone: phone ?? current.verifiedPhone ?? user.phone,
  }

  const updated: User = normalizeUserIdentity({
    ...user,
    phone: phone ?? user.phone,
    identityVerification: verification,
  })

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: updated.phone ?? null,
          identity_verification: identityVerificationToJson(verification),
        })
        .eq('id', userId)
      if (error) throw error
    }
  }

  await saveUser(updated)
  return updated
}

export async function updateUserVerificationStatus(
  userId: string,
  status: VerificationStatus,
  actingUser?: User | null,
): Promise<AdminUserActionResult> {
  const user = await resolveUserById(userId)
  if (!user) return { user: null, error: 'User not found.' }

  const verification = {
    ...getIdentityVerification(user),
    status,
    phoneVerified: status === 'verified' ? true : getIdentityVerification(user).phoneVerified,
  }

  const updated: User = normalizeUserIdentity({
    ...user,
    identityVerification: verification,
  })

  if (isSupabaseConfigured()) {
    const patchResult = await adminPatchIdentityVerification(userId, verification, actingUser)
    if (!patchResult.ok) {
      return { user: null, error: patchResult.error }
    }

    const serverUser = await fetchProfileVerificationAfterPatch(userId)
    if (serverUser) {
      await saveUser(serverUser)
      return { user: serverUser }
    }

    await saveUser(updated)
    return { user: updated }
  }

  await saveUser(updated)
  return { user: updated }
}

export async function approveUserVerification(
  userId: string,
  actingUser?: User | null,
): Promise<AdminUserActionResult> {
  return updateUserVerificationStatus(userId, 'verified', actingUser)
}

export async function rejectUserVerification(
  userId: string,
  actingUser?: User | null,
): Promise<AdminUserActionResult> {
  return updateUserVerificationStatus(userId, 'rejected', actingUser)
}
