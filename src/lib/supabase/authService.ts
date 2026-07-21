import type { AppRole, IdentityVerification, LoginMethod, User } from '../../types'
import { ADMIN_EMAIL, ADMIN_PHONE } from '../../data/seedData'
import { emptyIdentityVerification } from '../identityVerification'
import { normalizePhone } from '../phone'
import { authEmailFromPhone } from './config'
import { formatSupabaseAuthError } from './authErrors'
import { getSupabaseClient } from './client'
import { identityVerificationToJson, profileRowToUser } from './mappers'

export type SupabaseSignupInput = {
  name: string
  method: LoginMethod
  phone?: string
  email?: string
  password: string
  role: AppRole
}

function resolveAuthEmail(method: LoginMethod, phone?: string, email?: string): string | null {
  if (method === 'phone') {
    if (!phone?.trim()) return null
    return authEmailFromPhone(normalizePhone(phone))
  }
  if (!email?.trim()) return null
  return email.trim().toLowerCase()
}

async function authEmailForPhoneLogin(phone: string): Promise<{ authEmail: string | null; error: string | null }> {
  const normalized = normalizePhone(phone)
  if (!normalized.replace(/\D/g, '')) {
    return { authEmail: null, error: 'Enter a valid phone number.' }
  }

  if (normalized === normalizePhone(ADMIN_PHONE)) {
    return { authEmail: authEmailFromPhone(normalized), error: null }
  }

  const registered = await supabasePhoneInUse(phone)
  if (!registered) {
    return {
      authEmail: null,
      error: 'No account found for this phone number. Check the number or create an account.',
    }
  }

  return { authEmail: authEmailFromPhone(normalized), error: null }
}

export async function fetchProfileById(userId: string): Promise<User | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
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

  const normalized = normalizePhone(phone)
  const { data, error } = await supabase.from('profiles').select('id').eq('phone', normalized).maybeSingle()
  if (error) throw error
  return !!data
}

export async function supabaseEmailInUse(email: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const normalized = email.trim().toLowerCase()
  const { data, error } = await supabase.from('profiles').select('id').eq('email', normalized).maybeSingle()
  if (error) throw error
  return !!data
}

export async function supabaseSignIn(
  method: LoginMethod,
  identifier: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { user: null, error: 'Supabase is not configured.' }

  let authEmail: string
  if (method === 'phone') {
    const resolved = await authEmailForPhoneLogin(identifier)
    if (!resolved.authEmail || resolved.error) {
      return { user: null, error: resolved.error ?? 'Invalid credentials. Check your details and try again.' }
    }
    authEmail = resolved.authEmail
  } else {
    authEmail = identifier.trim().toLowerCase()
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password })
  if (
    error &&
    method === 'phone' &&
    normalizePhone(identifier) === normalizePhone(ADMIN_PHONE)
  ) {
    const legacyAdmin = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    })
    if (!legacyAdmin.error && legacyAdmin.data.user) {
      const profile = await fetchProfileById(legacyAdmin.data.user.id)
      if (!profile) return { user: null, error: 'Account profile not found. Contact support.' }
      return { user: profile, error: null }
    }
  }

  if (error) return { user: null, error: formatSupabaseAuthError(error.message) }
  if (!data.user) return { user: null, error: 'Sign in failed. Try again.' }

  const profile = await fetchProfileById(data.user.id)
  if (!profile) return { user: null, error: 'Account profile not found. Contact support.' }
  return { user: profile, error: null }
}

export async function supabaseSignUp(
  input: SupabaseSignupInput,
): Promise<{ user: User | null; error: string | null; needsEmailConfirmation?: boolean }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { user: null, error: 'Supabase is not configured.' }

  const authEmail = resolveAuthEmail(input.method, input.phone, input.email)
  if (!authEmail) {
    return { user: null, error: input.method === 'phone' ? 'Phone number is required.' : 'Email is required.' }
  }

  if (input.method === 'phone' && input.phone && (await supabasePhoneInUse(input.phone))) {
    return { user: null, error: 'This phone number is already registered.' }
  }
  if (input.method === 'email' && input.email && (await supabaseEmailInUse(input.email))) {
    return { user: null, error: 'This email is already registered.' }
  }

  const normalizedPhone = input.phone ? normalizePhone(input.phone) : undefined

  const signUpOptions: {
    email: string
    password: string
    options: { data: Record<string, string | undefined> }
  } = {
    email: authEmail,
    password: input.password,
    options: {
      data: {
        name: input.name.trim(),
        role: input.role,
        phone: normalizedPhone,
      },
    },
  }

  if (input.method === 'email' && input.email) {
    signUpOptions.options.data.login_email = input.email.trim().toLowerCase()
  }

  const { data, error } = await supabase.auth.signUp(signUpOptions)

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
    phone: normalizedPhone ?? null,
    email: input.method === 'email' ? input.email?.trim().toLowerCase() ?? null : null,
    role: input.role,
    identity_verification: identityVerificationToJson(emptyIdentityVerification()),
  }

  const { error: profileError } = await supabase.from('profiles').upsert(profilePayload)
  if (profileError) return { user: null, error: profileError.message }

  const profile = await fetchProfileById(data.user.id)
  if (!profile) return { user: null, error: 'Account created but profile missing. Contact support.' }
  return { user: profile, error: null }
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
