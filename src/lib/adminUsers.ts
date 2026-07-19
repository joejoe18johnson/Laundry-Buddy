import type { User, VerificationStatus } from '../types'
import { getAllUsers, getUserById, saveUser } from './authStorage'
import { getIdentityVerification, hasAddressProof, normalizeUserIdentity } from './identityVerification'
import { isSupabaseConfigured } from './supabase'
import { fetchProfileById } from './supabase/authService'
import { getSupabaseClient } from './supabase/client'
import { identityVerificationToJson, profileRowToUser } from './supabase/mappers'

/** Resolve a user from local training storage first, then Supabase. */
export async function resolveUserById(userId: string): Promise<User | null> {
  const local = await getUserById(userId)
  if (local) return local

  if (isSupabaseConfigured()) {
    return fetchProfileById(userId)
  }

  return null
}

export async function getAdminUsers(): Promise<User[]> {
  const users = await listAllUsers()
  return users.filter((entry) => entry.role === 'admin')
}

export async function listAllUsers(): Promise<User[]> {
  const localUsers = await getAllUsers()

  if (!isSupabaseConfigured()) {
    return localUsers
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return localUsers
  }

  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error || !data) {
    return localUsers
  }

  const merged = new Map<string, User>()
  for (const entry of data.map(profileRowToUser)) {
    merged.set(entry.id, entry)
  }
  for (const entry of localUsers) {
    merged.set(entry.id, entry)
  }

  return Array.from(merged.values())
}

export async function getAdminUserById(userId: string): Promise<User | null> {
  return resolveUserById(userId)
}

export function usersPendingIdReview(users: User[]): User[] {
  return users.filter((entry) => {
    const verification = getIdentityVerification(entry)
    if (verification.status !== 'pending' || !verification.idUploaded) return false
    if (entry.role === 'host') {
      return hasAddressProof(verification)
    }
    return true
  })
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
      await supabase
        .from('profiles')
        .update({
          phone: updated.phone ?? null,
          identity_verification: identityVerificationToJson(verification),
        })
        .eq('id', userId)
    }
  }

  await saveUser(updated)
  return updated
}

export async function updateUserVerificationStatus(
  userId: string,
  status: VerificationStatus,
): Promise<User | null> {
  const user = await resolveUserById(userId)
  if (!user) return null

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
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase
        .from('profiles')
        .update({ identity_verification: identityVerificationToJson(verification) })
        .eq('id', userId)
    }
  }

  await saveUser(updated)
  return updated
}

export async function approveUserVerification(userId: string): Promise<User | null> {
  return updateUserVerificationStatus(userId, 'verified')
}

export async function rejectUserVerification(userId: string): Promise<User | null> {
  return updateUserVerificationStatus(userId, 'rejected')
}
