import type { User } from '../../types'
import { getIdentityVerification, normalizeUserIdentity } from '../identityVerification'
import { isSupabaseConfigured } from './config'
import { getSupabaseClient } from './client'
import { supabaseUpdateProfile } from './authService'

export const ADMIN_EMAILS = ['support@laundrybuddy.app'] as const

export function isLikelyAdminUser(user: Pick<User, 'role' | 'email'>): boolean {
  if (user.role === 'admin') return true
  const email = user.email?.trim().toLowerCase()
  return !!email && ADMIN_EMAILS.includes(email as (typeof ADMIN_EMAILS)[number])
}

export type SupabaseAdminStatus = {
  hasSession: boolean
  isAdmin: boolean
  userId?: string
}

export async function getSupabaseAdminStatus(): Promise<SupabaseAdminStatus> {
  if (!isSupabaseConfigured()) {
    return { hasSession: false, isAdmin: false }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return { hasSession: false, isAdmin: false }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) {
    return { hasSession: false, isAdmin: false }
  }

  const { data, error } = await supabase.rpc('is_admin')
  if (error) {
    const email = sessionData.session?.user.email?.toLowerCase()
    const fallbackAdmin = !!email && ADMIN_EMAILS.includes(email as (typeof ADMIN_EMAILS)[number])
    return { hasSession: true, isAdmin: fallbackAdmin, userId }
  }

  return { hasSession: true, isAdmin: !!data, userId }
}

/** Promote the signed-in profile to admin (own-row update — allowed by RLS). */
export async function ensureSupabaseAdminProfile(user: User): Promise<User> {
  if (!isSupabaseConfigured() || !isLikelyAdminUser(user)) {
    return user
  }

  const verification = getIdentityVerification(user)
  const updated = normalizeUserIdentity({
    ...user,
    role: 'admin',
    email: user.email ?? ADMIN_EMAILS[0],
    identityVerification: {
      ...verification,
      status: verification.status === 'none' ? 'verified' : verification.status,
      phoneVerified: true,
      idUploaded: verification.idUploaded || true,
    },
  })

  return supabaseUpdateProfile(updated)
}

export async function prepareSupabaseAdminSession(user: User): Promise<{
  ok: boolean
  user: User
  error?: string
}> {
  const status = await getSupabaseAdminStatus()
  if (!status.hasSession) {
    return {
      ok: false,
      user,
      error:
        'Sign in with your Supabase support account (support@laundrybuddy.app) — training admin mode cannot send codes to live users.',
    }
  }

  try {
    const promoted = await ensureSupabaseAdminProfile(user)
    const nextStatus = await getSupabaseAdminStatus()
    if (!nextStatus.isAdmin) {
      return {
        ok: false,
        user: promoted,
        error:
          'Your Supabase profile is not admin yet. Run the admin migration SQL, then run: update profiles set role = \'admin\' where lower(email) = \'support@laundrybuddy.app\';',
      }
    }
    return { ok: true, user: promoted }
  } catch (err) {
    return {
      ok: false,
      user,
      error: err instanceof Error ? err.message : 'Could not prepare admin profile.',
    }
  }
}
