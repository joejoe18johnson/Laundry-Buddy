import type { AppRole, IdentityVerification, LoginMethod, User } from '../../types'
import { ADMIN_EMAIL, ADMIN_PHONE } from '../../data/seedData'
import { isValidEmail } from '../email'
import { emptyIdentityVerification } from '../identityVerification'
import { normalizePhone } from '../phone'
import { authEmailFromPhone } from './config'
import { getSupabaseAuthRedirectUrl } from './authRedirect'
import { formatSupabaseAuthError } from './authErrors'
import { getSupabaseClient } from './client'
import { identityVerificationToJson, profileRowToUser } from './mappers'

export type SupabaseSignupInput = {
  name: string
  phone: string
  email: string
  password: string
  role: AppRole
}

async function resolveAuthEmailsForPhoneLogin(phone: string): Promise<{ emails: string[]; error: string | null }> {
  const normalized = normalizePhone(phone)
  if (!normalized.replace(/\D/g, '')) {
    return { emails: [], error: 'Enter a valid phone number.' }
  }

  const synthetic = authEmailFromPhone(normalized)
  if (normalized === normalizePhone(ADMIN_PHONE)) {
    return { emails: [ADMIN_EMAIL, synthetic], error: null }
  }

  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase.rpc('auth_email_for_phone', { raw_phone: phone })
    if (!error && typeof data === 'string' && data.trim()) {
      const primary = data.trim().toLowerCase()
      const emails = primary === synthetic ? [primary] : [primary, synthetic]
      return { emails, error: null }
    }
  }

  const profile = await fetchProfileByPhone(normalized)
  if (profile?.email) {
    const profileEmail = profile.email.trim().toLowerCase()
    return {
      emails: profileEmail === synthetic ? [profileEmail] : [profileEmail, synthetic],
      error: null,
    }
  }

  return { emails: [synthetic], error: null }
}

async function ensureProfileForAuthUser(
  authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> },
  loginPhone?: string,
): Promise<User | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const existing = await fetchProfileById(authUser.id)
  const meta = authUser.user_metadata ?? {}
  const normalizedPhone = loginPhone
    ? normalizePhone(loginPhone)
    : typeof meta.phone === 'string' && meta.phone.trim()
      ? normalizePhone(meta.phone)
      : undefined
  const profileEmail =
    typeof meta.login_email === 'string' && meta.login_email.trim()
      ? meta.login_email.trim().toLowerCase()
      : authUser.email?.trim().toLowerCase() ?? null

  if (existing) {
    let next = existing
    if (normalizedPhone && existing.phone !== normalizedPhone) {
      next = { ...next, phone: normalizedPhone }
    }
    if (profileEmail && existing.email !== profileEmail) {
      next = { ...next, email: profileEmail }
    }
    if (next !== existing) {
      return supabaseUpdateProfile(next)
    }
    return existing
  }

  const role: AppRole = meta.role === 'host' || meta.role === 'admin' ? meta.role : 'customer'
  const profilePayload = {
    id: authUser.id,
    name: typeof meta.name === 'string' && meta.name.trim() ? meta.name.trim() : 'Laundry Buddy user',
    phone: normalizedPhone ?? null,
    email: profileEmail,
    role,
    identity_verification: identityVerificationToJson(emptyIdentityVerification()),
  }

  const { error: profileError } = await supabase.from('profiles').upsert(profilePayload)
  if (profileError) return null

  return fetchProfileById(authUser.id)
}

export async function fetchProfileById(userId: string): Promise<User | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  if (!data) return null
  return profileRowToUser(data)
}

export async function fetchProfileByPhone(phone: string): Promise<User | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const normalized = normalizePhone(phone)
  const { data, error } = await supabase.from('profiles').select('*').eq('phone', normalized).maybeSingle()
  if (error) throw error
  if (!data) return null
  return profileRowToUser(data)
}

export async function fetchCurrentSupabaseUser(): Promise<User | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const userId = data.session?.user.id
  if (!userId) return null
  return fetchProfileById(userId)
}

export async function supabasePhoneInUse(phone: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data, error } = await supabase.rpc('profile_phone_in_use', { raw_phone: phone })
  if (!error && typeof data === 'boolean') return data

  const normalized = normalizePhone(phone)
  const { data: row, error: lookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', normalized)
    .maybeSingle()
  if (lookupError) throw lookupError
  return !!row
}

export async function supabaseEmailInUse(email: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data, error } = await supabase.rpc('profile_email_in_use', { raw_email: email })
  if (!error && typeof data === 'boolean') return data

  const normalized = email.trim().toLowerCase()
  const { data: row, error: lookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalized)
    .maybeSingle()
  if (lookupError) throw lookupError
  return !!row
}

export async function supabaseSignIn(
  method: LoginMethod,
  identifier: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { user: null, error: 'Supabase is not configured.' }

  let authEmails: string[]
  if (method === 'phone') {
    const resolved = await resolveAuthEmailsForPhoneLogin(identifier)
    if (!resolved.emails.length || resolved.error) {
      return { user: null, error: resolved.error ?? 'Invalid credentials. Check your details and try again.' }
    }
    authEmails = resolved.emails
  } else {
    authEmails = [identifier.trim().toLowerCase()]
  }

  let signedInUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null
  let lastError: { message: string } | null = null

  for (const authEmail of authEmails) {
    const attempt = await supabase.auth.signInWithPassword({ email: authEmail, password })
    if (!attempt.error && attempt.data.user) {
      signedInUser = attempt.data.user
      lastError = null
      break
    }
    lastError = attempt.error
  }

  if (
    lastError &&
    method === 'phone' &&
    normalizePhone(identifier) === normalizePhone(ADMIN_PHONE)
  ) {
    const legacyAdmin = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    })
    if (!legacyAdmin.error && legacyAdmin.data.user) {
      const profile = await ensureProfileForAuthUser(legacyAdmin.data.user, identifier)
      if (!profile) return { user: null, error: 'Account profile not found. Contact support.' }
      return { user: profile, error: null }
    }
  }

  if (lastError) {
    const message =
      method === 'phone'
        ? 'Invalid phone or password. Double-check your details or create an account.'
        : formatSupabaseAuthError(lastError.message)
    return { user: null, error: message }
  }
  if (!signedInUser) return { user: null, error: 'Sign in failed. Try again.' }

  const profile = await ensureProfileForAuthUser(
    signedInUser,
    method === 'phone' ? identifier : undefined,
  )
  if (!profile) return { user: null, error: 'Account profile not found. Contact support.' }
  return { user: profile, error: null }
}

export async function supabaseSignUp(
  input: SupabaseSignupInput,
): Promise<{ user: User | null; error: string | null; needsEmailConfirmation?: boolean }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { user: null, error: 'Supabase is not configured.' }

  const authEmail = input.email.trim().toLowerCase()
  if (!isValidEmail(authEmail)) {
    return { user: null, error: 'Enter a valid email address.' }
  }
  if (!input.phone?.trim()) {
    return { user: null, error: 'Phone number is required.' }
  }

  if (await supabasePhoneInUse(input.phone)) {
    return { user: null, error: 'This phone number is already registered.' }
  }
  if (await supabaseEmailInUse(authEmail)) {
    return { user: null, error: 'This email is already registered.' }
  }

  const normalizedPhone = normalizePhone(input.phone)

  const { data, error } = await supabase.auth.signUp({
    email: authEmail,
    password: input.password,
    options: {
      data: {
        name: input.name.trim(),
        role: input.role,
        phone: normalizedPhone,
        login_email: authEmail,
      },
    },
  })

  if (error) return { user: null, error: formatSupabaseAuthError(error.message) }
  if (!data.user) return { user: null, error: 'Sign up failed. Try again.' }

  if (!data.session) {
    return {
      user: null,
      error: null,
      needsEmailConfirmation: true,
    }
  }

  const profilePayload = {
    id: data.user.id,
    name: input.name.trim(),
    phone: normalizedPhone,
    email: authEmail,
    role: input.role,
    identity_verification: identityVerificationToJson(emptyIdentityVerification()),
  }

  const { error: profileError } = await supabase.from('profiles').upsert(profilePayload)
  if (profileError) return { user: null, error: profileError.message }

  const profile = await fetchProfileById(data.user.id)
  if (!profile) return { user: null, error: 'Account created but profile missing. Contact support.' }
  return { user: profile, error: null }
}

export async function supabaseRequestPasswordReset(email: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: 'Supabase is not configured.' }

  const normalized = email.trim().toLowerCase()
  if (!isValidEmail(normalized)) {
    return { error: 'Enter a valid email address.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
    redirectTo: getSupabaseAuthRedirectUrl('recovery'),
  })
  if (error) return { error: formatSupabaseAuthError(error.message) }
  return { error: null }
}

export async function supabaseUpdatePassword(newPassword: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: 'Supabase is not configured.' }

  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: formatSupabaseAuthError(error.message) }
  return { error: null }
}

export async function supabaseSignOut(): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function supabaseUpdateProfile(user: User): Promise<User> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase
    .from('profiles')
    .update({
      name: user.name,
      phone: user.phone ?? null,
      email: user.email ?? null,
      role: user.role,
      identity_verification: identityVerificationToJson(
        user.identityVerification ?? emptyIdentityVerification(),
      ),
    })
    .eq('id', user.id)
    .select('*')
    .single()

  if (error) throw error
  return profileRowToUser(data)
}

export async function supabaseSubmitIdentityVerification(
  user: User,
  verification: IdentityVerification,
  normalizedPhone: string,
): Promise<User> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data: existing, error: lookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', normalizedPhone)
    .neq('id', user.id)
    .maybeSingle()

  if (lookupError) throw lookupError
  if (existing) throw new Error('PHONE_IN_USE')

  return supabaseUpdateProfile({
    ...user,
    phone: normalizedPhone,
    identityVerification: verification,
  })
}
