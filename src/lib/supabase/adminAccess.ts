import type { User } from '../../types'
import { ADMIN_EMAIL, ADMIN_PHONE, ADMIN_SEED_PASSWORD } from '../../data/seedData'
import { getIdentityVerification, normalizeUserIdentity } from '../identityVerification'
import { isSupabaseConfigured } from './config'
import { authEmailFromPhone } from './config'
import { getSupabaseClient } from './client'
import { fetchProfileById, supabaseSignIn, supabaseSignUp, supabaseUpdateProfile } from './authService'
import { normalizePhone } from '../phone'

export const ADMIN_EMAILS = [ADMIN_EMAIL] as const

export function isLikelyAdminUser(user: Pick<User, 'role' | 'email' | 'phone'>): boolean {
  if (user.role === 'admin') return true
  const email = user.email?.trim().toLowerCase()
  if (!!email && ADMIN_EMAILS.includes(email as (typeof ADMIN_EMAILS)[number])) return true
  if (user.phone && normalizePhone(user.phone) === normalizePhone(ADMIN_PHONE)) return true
  return false
}

function adminAuthEmails(): string[] {
  const synthetic = authEmailFromPhone(ADMIN_PHONE)
  return synthetic === ADMIN_EMAIL ? [ADMIN_EMAIL] : [ADMIN_EMAIL, synthetic]
}

async function signInAdminAccount(password: string): Promise<{ user: User | null; error: string | null }> {
  for (const authEmail of adminAuthEmails()) {
    const attempt = await supabaseSignIn('email', authEmail, password)
    if (attempt.user) return attempt
  }
  return { user: null, error: 'Could not sign in the support admin account.' }
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
    phone: user.phone ?? ADMIN_PHONE,
    identityVerification: {
      ...verification,
      status: verification.status === 'none' ? 'verified' : verification.status,
      phoneVerified: true,
      idUploaded: verification.idUploaded || true,
    },
  })

  return supabaseUpdateProfile(updated)
}

/** Sign the Support admin training account into Supabase (auto-create if missing). */
export async function ensureTrainingAdminSupabaseSession(
  localUser?: User | null,
): Promise<{ ok: boolean; user: User | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, user: localUser ?? null, error: 'Supabase is not configured.' }
  }

  const status = await getSupabaseAdminStatus()
  if (status.hasSession && status.isAdmin && status.userId) {
    const profile = await fetchProfileById(status.userId)
    if (profile) {
      const promoted = await ensureSupabaseAdminProfile(
        normalizeUserIdentity({ ...profile, role: 'admin' }),
      )
      return { ok: true, user: promoted }
    }
  }

  const email = (localUser?.email ?? ADMIN_EMAILS[0]).trim().toLowerCase()
  const password = ADMIN_SEED_PASSWORD
  const name = localUser?.name?.trim() || 'Support Admin'

  let signedIn: User | null = null
  let lastError: string | null = null
  const signInAttempt = await signInAdminAccount(password)
  signedIn = signInAttempt.user
  lastError = signInAttempt.error

  if (!signedIn) {
    const signUpAttempt = await supabaseSignUp({
      name,
      phone: localUser?.phone ?? ADMIN_PHONE,
      email,
      password,
      role: 'admin',
    })

    if (signUpAttempt.user) {
      signedIn = signUpAttempt.user
      lastError = null
    } else if (signUpAttempt.needsEmailConfirmation) {
      const retry = await signInAdminAccount(password)
      signedIn = retry.user
      lastError = retry.error
      if (!signedIn) {
        return {
          ok: false,
          user: localUser ?? null,
          error:
            'Support admin account needs email confirmation in Supabase. Disable confirm email for dev, or confirm support@laundrybuddy.app once.',
        }
      }
    } else {
      const retry = await signInAdminAccount(password)
      signedIn = retry.user
      lastError = retry.error ?? signUpAttempt.error ?? lastError
      if (!signedIn) {
        return {
          ok: false,
          user: localUser ?? null,
          error:
            signUpAttempt.error ??
            lastError ??
            'Could not link the Support admin account to Supabase. Use password demo1234 or reset it via Forgot password.',
        }
      }
    }
  }

  let sessionUser = normalizeUserIdentity({
    ...signedIn,
    role: 'admin',
    email: signedIn.email ?? ADMIN_EMAIL,
    phone: signedIn.phone ?? ADMIN_PHONE,
  })
  try {
    sessionUser = await ensureSupabaseAdminProfile(sessionUser)
  } catch (err) {
    return {
      ok: false,
      user: sessionUser,
      error: err instanceof Error ? err.message : 'Could not prepare admin profile.',
    }
  }

  if (!isLikelyAdminUser(sessionUser)) {
    return {
      ok: false,
      user: sessionUser,
      error:
        'Signed in, but admin access is not active. Run supabase/migrations/20260719000000_admin_profile_updates.sql in Supabase SQL Editor.',
    }
  }

  return { ok: true, user: sessionUser }
}

export async function prepareSupabaseAdminSession(user: User): Promise<{
  ok: boolean
  user: User
  error?: string
}> {
  let status = await getSupabaseAdminStatus()
  if (!status.hasSession && isLikelyAdminUser(user)) {
    const linked = await ensureTrainingAdminSupabaseSession(user)
    if (linked.ok && linked.user) {
      user = linked.user
      status = await getSupabaseAdminStatus()
    } else if (!linked.ok) {
      return { ok: false, user: linked.user ?? user, error: linked.error }
    }
  }

  if (!status.hasSession) {
    return {
      ok: false,
      user,
      error: 'Sign in as Support admin to use verification tools.',
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
