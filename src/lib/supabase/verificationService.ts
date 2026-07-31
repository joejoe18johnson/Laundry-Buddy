import type { IdentityVerification, User } from '../../types'
import { normalizeIdentityVerification, normalizeUserIdentity } from '../identityVerification'
import { prepareSupabaseAdminSession } from './adminAccess'
import { getSupabaseClient } from './client'
import { identityVerificationToJson, parseIdentityVerification, profileRowToUser } from './mappers'
import { isSupabaseProfileId } from './profileIds'

export type AdminPatchResult =
  | { ok: true; verification: IdentityVerification }
  | { ok: false; error: string }

/** Persist corrected verification when Supabase still has pending but all docs are approved. */
export async function syncRepairedVerificationIfNeeded(
  userId: string,
  rawVerification: IdentityVerification,
  user: Pick<User, 'role' | 'phone'>,
): Promise<IdentityVerification | null> {
  if (!isSupabaseProfileId(userId)) return null

  const normalized = normalizeIdentityVerification(user, rawVerification)
  if (rawVerification.status !== 'pending' || normalized.status !== 'verified') {
    return null
  }

  const supabase = getSupabaseClient()
  if (!supabase) return normalized

  const { error } = await supabase
    .from('profiles')
    .update({ identity_verification: identityVerificationToJson(normalized) })
    .eq('id', userId)

  return error ? null : normalized
}

export async function adminPatchIdentityVerification(
  userId: string,
  patch: Partial<IdentityVerification>,
  actingUser?: User | null,
): Promise<AdminPatchResult> {
  if (!isSupabaseProfileId(userId)) {
    return {
      ok: false,
      error:
        'This training account is not linked to Supabase. Find the same user by phone in the admin list.',
    }
  }

  const supabase = getSupabaseClient()
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }

  if (actingUser) {
    const prepared = await prepareSupabaseAdminSession(actingUser)
    if (!prepared.ok) {
      return { ok: false, error: prepared.error ?? 'Admin session not ready.' }
    }
  } else {
    const { getSupabaseAdminStatus } = await import('./adminAccess')
    const status = await getSupabaseAdminStatus()
    if (!status.hasSession || !status.isAdmin) {
      return {
        ok: false,
        error:
          'Your account is not recognized as admin in Supabase. Tap Support admin on the welcome screen, then run the admin migration SQL if needed.',
      }
    }
  }

  const { data, error } = await supabase.rpc('admin_patch_identity_verification', {
    target_user_id: userId,
    patch: identityVerificationToJson(patch as IdentityVerification) ?? {},
  })

  if (error) {
    const message = error.message.includes('not authorized')
      ? 'Your account is not recognized as admin in Supabase. Tap Support admin on the welcome screen and run the admin migration SQL if needed.'
      : error.message.includes('Could not find the function')
        ? 'Admin database functions are missing. Run supabase/migrations/20260719000000_admin_profile_updates.sql in Supabase SQL Editor.'
        : error.message
    return { ok: false, error: message }
  }

  if (!data || typeof data !== 'object') {
    return {
      ok: false,
      error: 'Approval did not save on the server. Run supabase/migrations/20260719000000_admin_profile_updates.sql in Supabase.',
    }
  }

  return { ok: true, verification: data as unknown as IdentityVerification }
}

export async function fetchProfileVerificationAfterPatch(userId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error || !data) return null
  return profileRowToUser(data)
}
