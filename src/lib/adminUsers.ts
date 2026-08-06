import type { IdentityVerification, User, VerificationStatus } from '../types'
import { DEMO_ADMIN_EXCLUDED_CONTACTS, DEMO_ADMIN_HIDDEN_USER_IDS } from '../data/seedData'
import { getAllUsers, getUserById, purgeUsersExcept, removeUser, saveUser } from './authStorage'
import {
  getIdentityVerification,
  getAddressReviewStatus,
  getIdReviewStatus,
  getSelfieReviewStatus,
  hasAddressProof,
  hasCompletedPhoneVerification,
  hasIdDocument,
  hasSelfie,
  mergeUserProfiles,
  normalizeIdentityVerification,
  normalizeUserIdentity,
  recomputeOverallVerification,
} from './identityVerification'
import { isSupabaseConfigured } from './supabase'
import { fetchProfileById } from './supabase/authService'
import { getSupabaseClient } from './supabase/client'
import { isSupabaseProfileId, resolveSupabaseProfileId } from './supabase/profileIds'
import {
  adminPatchIdentityVerification,
  fetchProfileVerificationAfterPatch,
  syncRepairedVerificationIfNeeded,
} from './supabase/verificationService'
import { identityVerificationToJson, parseIdentityVerification, profileRowToUser } from './supabase/mappers'
import { purgeVerificationRequestsExcept, purgeVerificationRequestsForUser } from './verificationRequestStorage'

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

export function isVerificationStuck(
  user: Pick<User, 'role' | 'phone' | 'identityVerification'>,
  rawVerification: IdentityVerification,
): boolean {
  const normalized = normalizeIdentityVerification(user, rawVerification)
  return rawVerification.status === 'pending' && normalized.status === 'verified'
}

/** When admin approved each document but overall status stayed pending, persist the fix. */
export async function repairStuckVerificationIfNeeded(
  user: User,
  rawVerification: IdentityVerification,
): Promise<User> {
  const supabaseUserId = (await resolveSupabaseProfileId(user)) ?? user.id
  const synced = await syncRepairedVerificationIfNeeded(supabaseUserId, rawVerification, user)
  if (!synced) {
    return normalizeUserIdentity({ ...user, identityVerification: rawVerification })
  }
  return normalizeUserIdentity({ ...user, id: supabaseUserId, identityVerification: synced })
}

async function resolveSupabaseUser(user: User): Promise<{ user: User; supabaseUserId: string | null }> {
  const supabaseUserId = isSupabaseConfigured() ? await resolveSupabaseProfileId(user) : null
  const canonicalId = supabaseUserId ?? user.id
  return {
    user: canonicalId === user.id ? user : { ...user, id: canonicalId },
    supabaseUserId,
  }
}

async function purgeDeletedSupabaseUser(userId: string): Promise<void> {
  await removeUser(userId)
  await purgeVerificationRequestsForUser(userId)
}

function isDemoAccountHiddenFromAdmin(user: User): boolean {
  if (DEMO_ADMIN_HIDDEN_USER_IDS.has(user.id)) return true
  if (DEMO_ADMIN_EXCLUDED_CONTACTS.names.has(user.name)) return true
  if (user.email && DEMO_ADMIN_EXCLUDED_CONTACTS.emails.has(user.email.toLowerCase())) return true
  if (user.phone && DEMO_ADMIN_EXCLUDED_CONTACTS.phones.has(user.phone)) return true
  return false
}

/** Resolve a user from local cache and Supabase, preferring the latest verification state. */
export async function resolveUserById(userId: string): Promise<User | null> {
  const local = await getUserById(userId)

  if (!isSupabaseConfigured()) {
    return local
  }

  const lookupUser = local ?? ({ id: userId } as User)
  const supabaseUserId = await resolveSupabaseProfileId(lookupUser)
  const remoteId = supabaseUserId ?? (isSupabaseProfileId(userId) ? userId : null)

  let remote: User | null = null
  if (remoteId) {
    try {
      remote = await fetchProfileById(remoteId)
    } catch {
      remote = null
    }
  }

  if (local && remote) {
    const merged = mergeUserProfiles(remote, { ...local, id: remote.id })
    return cacheResolvedUser(merged, local)
  }

  if (remote) {
    return cacheResolvedUser(remote, local)
  }

  if (remoteId && isSupabaseProfileId(remoteId)) {
    await purgeDeletedSupabaseUser(remoteId)
    return null
  }

  if (local && isSupabaseProfileId(local.id)) {
    await purgeDeletedSupabaseUser(local.id)
    return null
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
  for (const row of data) {
    const rawVerification = parseIdentityVerification(row.identity_verification)
    const baseUser = profileRowToUser(row)
    const repaired = await repairStuckVerificationIfNeeded(baseUser, rawVerification)
    merged.set(repaired.id, repaired)
  }

  for (const entry of localUsers) {
    if (isSupabaseProfileId(entry.id)) {
      const remote = merged.get(entry.id)
      if (remote) {
        merged.set(entry.id, mergeUserProfiles(remote, entry))
      }
      continue
    }

    const resolvedId = await resolveSupabaseProfileId(entry)
    if (resolvedId) {
      const remote = merged.get(resolvedId)
      if (remote) {
        merged.set(resolvedId, mergeUserProfiles(remote, entry))
      }
      continue
    }

    if (!merged.has(entry.id) && !isDemoAccountHiddenFromAdmin(entry)) {
      merged.set(entry.id, entry)
    }
  }

  for (const user of merged.values()) {
    if (isDemoAccountHiddenFromAdmin(user)) {
      merged.delete(user.id)
    }
  }

  const keepIds = new Set(Array.from(merged.keys()))
  await purgeUsersExcept(keepIds)
  await purgeVerificationRequestsExcept(keepIds)
  await removeUser('user-maria')

  return sortUsersNewestFirst(Array.from(merged.values()))
}

export async function getAdminUserById(userId: string): Promise<User | null> {
  return resolveUserById(userId)
}

export function usersPendingIdReview(users: User[]): User[] {
  return sortUsersNewestFirst(
    users.filter((entry) => {
      const verification = getIdentityVerification(entry)
      if (!hasCompletedPhoneVerification(verification)) return false

      const idNeedsReview = hasIdDocument(verification) && getIdReviewStatus(verification) === 'pending'
      const selfieNeedsReview = hasSelfie(verification) && getSelfieReviewStatus(verification) === 'pending'
      const addressNeedsReview =
        entry.role === 'host' &&
        hasAddressProof(verification) &&
        getAddressReviewStatus(verification) === 'pending'

      return idNeedsReview || selfieNeedsReview || addressNeedsReview
    }),
  )
}

/** Users approved doc-by-doc but Supabase overall status still pending. */
export function usersStuckPendingVerification(
  users: User[],
  rawVerificationByUserId?: Map<string, IdentityVerification>,
): User[] {
  return sortUsersNewestFirst(
    users.filter((entry) => {
      const raw = rawVerificationByUserId?.get(entry.id)
      if (raw) {
        return isVerificationStuck(entry, raw)
      }

      const verification = getIdentityVerification(entry)
      if (verification.status !== 'pending') return false
      if (!hasCompletedPhoneVerification(verification)) return false

      const idOk = !hasIdDocument(verification) || getIdReviewStatus(verification) === 'approved'
      const selfieOk = !hasSelfie(verification) || getSelfieReviewStatus(verification) === 'approved'
      const addressOk =
        entry.role !== 'host' ||
        !hasAddressProof(verification) ||
        getAddressReviewStatus(verification) === 'approved'

      return idOk && selfieOk && addressOk
    }),
  )
}

export async function markPhoneVerifiedForUser(userId: string, phone?: string): Promise<User | null> {
  const user = await resolveUserById(userId)
  if (!user) return null

  const { user: canonicalUser, supabaseUserId } = await resolveSupabaseUser(user)
  const current = getIdentityVerification(canonicalUser)
  const verification = {
    ...current,
    phoneVerified: true,
    verifiedPhone: phone ?? current.verifiedPhone ?? canonicalUser.phone,
  }

  const updated: User = normalizeUserIdentity({
    ...canonicalUser,
    phone: phone ?? canonicalUser.phone,
    identityVerification: verification,
  })

  if (isSupabaseConfigured() && supabaseUserId) {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: updated.phone ?? null,
          identity_verification: identityVerificationToJson(verification),
        })
        .eq('id', supabaseUserId)
      if (error) throw error
    }
  }

  await saveUser(updated)
  return updated
}

export async function patchUserIdentityVerification(
  userId: string,
  patch: Partial<IdentityVerification>,
  actingUser?: User | null,
): Promise<AdminUserActionResult> {
  const user = await resolveUserById(userId)
  if (!user) return { user: null, error: 'User not found.' }

  const { user: canonicalUser, supabaseUserId } = await resolveSupabaseUser(user)
  const verification = recomputeOverallVerification(canonicalUser, {
    ...getIdentityVerification(canonicalUser),
    ...patch,
  })

  const updated: User = normalizeUserIdentity({
    ...canonicalUser,
    identityVerification: verification,
  })

  if (isSupabaseConfigured()) {
    if (!supabaseUserId) {
      await saveUser(updated)
      return {
        user: updated,
        error:
          'This training account is not linked to Supabase. Find the same person by phone in the user list, or ask them to sign up on a device with Supabase connected.',
      }
    }

    const patchResult = await adminPatchIdentityVerification(supabaseUserId, verification, actingUser)
    if (!patchResult.ok) {
      return { user: null, error: patchResult.error }
    }

    let serverUser = await fetchProfileVerificationAfterPatch(supabaseUserId)
    if (serverUser) {
      const normalized = normalizeUserIdentity(serverUser)
      const serverStatus = getIdentityVerification(serverUser).status
      const normalizedStatus = getIdentityVerification(normalized).status

      if (normalizedStatus !== serverStatus) {
        const syncResult = await adminPatchIdentityVerification(
          supabaseUserId,
          getIdentityVerification(normalized),
          actingUser,
        )
        if (syncResult.ok) {
          serverUser = (await fetchProfileVerificationAfterPatch(supabaseUserId)) ?? normalized
        } else {
          serverUser = normalized
        }
      } else if (normalizedStatus !== getIdentityVerification(serverUser).status) {
        serverUser = normalized
      }

      await saveUser(serverUser)
      return { user: serverUser }
    }

    await saveUser(updated)
    return { user: updated }
  }

  await saveUser(updated)
  return { user: updated }
}

export async function updateUserVerificationStatus(
  userId: string,
  status: VerificationStatus,
  actingUser?: User | null,
): Promise<AdminUserActionResult> {
  const user = await resolveUserById(userId)
  if (!user) return { user: null, error: 'User not found.' }

  const current = getIdentityVerification(user)
  const patch: Partial<typeof current> = {
    status,
    phoneVerified: status === 'verified' ? true : current.phoneVerified,
  }

  if (status === 'verified') {
    if (hasIdDocument(current)) patch.idReviewStatus = 'approved'
    if (hasSelfie(current)) patch.selfieReviewStatus = 'approved'
    if (user.role === 'host' && hasAddressProof(current)) patch.addressReviewStatus = 'approved'
  }

  if (status === 'rejected') {
    if (hasIdDocument(current)) patch.idReviewStatus = 'rejected'
    if (hasSelfie(current)) patch.selfieReviewStatus = 'rejected'
    if (user.role === 'host' && hasAddressProof(current)) patch.addressReviewStatus = 'rejected'
  }

  return patchUserIdentityVerification(userId, patch, actingUser)
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

export async function approveUserIdVerification(
  userId: string,
  actingUser?: User | null,
): Promise<AdminUserActionResult> {
  return patchUserIdentityVerification(userId, { idReviewStatus: 'approved' }, actingUser)
}

export async function rejectUserIdVerification(
  userId: string,
  actingUser?: User | null,
): Promise<AdminUserActionResult> {
  return patchUserIdentityVerification(userId, { idReviewStatus: 'rejected' }, actingUser)
}

export async function approveUserAddressVerification(
  userId: string,
  actingUser?: User | null,
): Promise<AdminUserActionResult> {
  return patchUserIdentityVerification(userId, { addressReviewStatus: 'approved' }, actingUser)
}

export async function rejectUserAddressVerification(
  userId: string,
  actingUser?: User | null,
): Promise<AdminUserActionResult> {
  return patchUserIdentityVerification(userId, { addressReviewStatus: 'rejected' }, actingUser)
}

export async function approveUserSelfieVerification(
  userId: string,
  actingUser?: User | null,
): Promise<AdminUserActionResult> {
  return patchUserIdentityVerification(userId, { selfieReviewStatus: 'approved' }, actingUser)
}

export async function rejectUserSelfieVerification(
  userId: string,
  actingUser?: User | null,
): Promise<AdminUserActionResult> {
  return patchUserIdentityVerification(userId, { selfieReviewStatus: 'rejected' }, actingUser)
}
