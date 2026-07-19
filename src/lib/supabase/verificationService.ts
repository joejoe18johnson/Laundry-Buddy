import type { IdentityVerification } from '../../types'
import { getSupabaseClient } from './client'
import { identityVerificationToJson, profileRowToUser } from './mappers'

export type AdminPatchResult =
  | { ok: true; verification: IdentityVerification }
  | { ok: false; error: string }

export async function adminPatchIdentityVerification(
  userId: string,
  patch: Partial<IdentityVerification>,
): Promise<AdminPatchResult> {
  const supabase = getSupabaseClient()
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }

  const { data, error } = await supabase.rpc('admin_patch_identity_verification', {
    target_user_id: userId,
    patch: identityVerificationToJson(patch as IdentityVerification) ?? {},
  })

  if (error) {
    const message = error.message.includes('not authorized')
      ? 'Your account is not recognized as admin in Supabase. Run the latest migration and ensure your profile role is admin.'
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
