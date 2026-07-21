import type { EmailOtpType } from '@supabase/supabase-js'
import type { User } from '../../types'
import { getSupabaseUrl } from './config'
import { getSupabaseClient } from './client'
import { profileRowToUser } from './mappers'

const AUTH_CALLBACK_PATH = 'auth/callback'
const APP_DEEP_LINK = `laundrybuddy://${AUTH_CALLBACK_PATH}`

/** Public bucket path — upload `supabase/public/auth-callback.html` here. */
export const AUTH_CALLBACK_STORAGE_PATH = 'app-public/auth-callback.html'

export type AuthRedirectFlow = 'recovery' | 'confirm'

function appendFlowToRedirect(base: string, flow?: AuthRedirectFlow): string {
  if (!flow) return base

  const marker = flow === 'recovery' ? 'auth_flow=recovery' : 'auth_flow=confirm'
  if (base.includes('?')) {
    return base.includes('auth_flow=') ? base : `${base}&${marker}`
  }
  return `${base}?${marker}`
}

function hostedAuthCallbackUrl(): string | undefined {
  const override = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim()
  if (override) return override

  const supabaseUrl = getSupabaseUrl()
  if (!supabaseUrl) return undefined

  return `${supabaseUrl}/storage/v1/object/public/${AUTH_CALLBACK_STORAGE_PATH}`
}

/** Hosted callback page — required for password reset links opened in email browsers. */
export function getHostedAuthCallbackUrl(): string | undefined {
  return hostedAuthCallbackUrl()
}

/** Redirect target for Supabase auth emails. Uses hosted page when Supabase is configured. */
export function getSupabaseAuthRedirectUrl(flow?: AuthRedirectFlow): string {
  const hosted = hostedAuthCallbackUrl()
  if (hosted) return appendFlowToRedirect(hosted, flow)
  return appendFlowToRedirect(APP_DEEP_LINK, flow)
}

/** Deep link the mobile app handles after the hosted page forwards tokens. */
export function getSupabaseAuthDeepLinkUrl(flow?: AuthRedirectFlow): string {
  return appendFlowToRedirect(APP_DEEP_LINK, flow)
}

function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {}
  const hashIndex = url.indexOf('#')
  const queryIndex = url.indexOf('?')
  const paramString =
    hashIndex >= 0 ? url.slice(hashIndex + 1) : queryIndex >= 0 ? url.slice(queryIndex + 1) : ''

  for (const pair of paramString.split('&')) {
    if (!pair) continue
    const [rawKey, rawValue = ''] = pair.split('=')
    if (!rawKey) continue
    params[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.replace(/\+/g, ' '))
  }

  return params
}

export function isSupabaseAuthCallbackUrl(url: string | null | undefined): boolean {
  if (!url) return false
  if (url.startsWith('laundrybuddy://') && url.includes(AUTH_CALLBACK_PATH)) return true
  if (url.startsWith('exp://') && url.includes(AUTH_CALLBACK_PATH)) return true
  if (url.startsWith('exp+laundry-buddy://') && url.includes(AUTH_CALLBACK_PATH)) return true
  const hosted = hostedAuthCallbackUrl()
  if (hosted && url.startsWith(hosted.split('?')[0] ?? hosted)) return true
  return false
}

async function profileFromActiveSession(): Promise<{ user: User | null; error: string | null }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { user: null, error: 'Supabase is not configured.' }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) return { user: null, error: sessionError.message }
  if (!session?.user.id) {
    return { user: null, error: 'Link opened, but session could not start. Try again or log in.' }
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  if (profileError) return { user: null, error: profileError.message }
  if (!profileRow) {
    return { user: null, error: 'Email confirmed, but profile was not found. Contact support.' }
  }

  return { user: profileRowToUser(profileRow), error: null }
}

/** Exchange tokens from a confirmation redirect into a Supabase session. */
export async function createSessionFromAuthRedirectUrl(
  url: string,
): Promise<{ user: User | null; error: string | null; confirmed: boolean; recovery: boolean }> {
  if (!isSupabaseAuthCallbackUrl(url)) {
    return { user: null, error: null, confirmed: false, recovery: false }
  }

  const params = parseUrlParams(url)
  const isRecovery = params.type === 'recovery' || params.auth_flow === 'recovery'
  const errorDescription = params.error_description || params.error
  if (errorDescription) {
    return { user: null, error: errorDescription, confirmed: false, recovery: isRecovery }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return { user: null, error: 'Supabase is not configured.', confirmed: false, recovery: isRecovery }
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code)
    if (error) return { user: null, error: error.message, confirmed: false, recovery: isRecovery }
    const profile = await profileFromActiveSession()
    return { ...profile, confirmed: !isRecovery, recovery: isRecovery }
  }

  if (params.token_hash && params.type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type as EmailOtpType,
    })
    if (error) return { user: null, error: error.message, confirmed: false, recovery: isRecovery }
    const profile = await profileFromActiveSession()
    return { ...profile, confirmed: !isRecovery, recovery: isRecovery }
  }

  const accessToken = params.access_token
  const refreshToken = params.refresh_token
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (error) return { user: null, error: error.message, confirmed: false, recovery: isRecovery }
    const profile = await profileFromActiveSession()
    return { ...profile, confirmed: !isRecovery, recovery: isRecovery }
  }

  return { user: null, error: null, confirmed: false, recovery: false }
}

/** Useful for debugging — log in dev what redirect URL sign-up will use. */
export function getAuthRedirectDebugInfo(): { emailRedirectTo: string; deepLink: string } {
  return {
    emailRedirectTo: getSupabaseAuthRedirectUrl('recovery'),
    deepLink: getSupabaseAuthDeepLinkUrl('recovery'),
  }
}
