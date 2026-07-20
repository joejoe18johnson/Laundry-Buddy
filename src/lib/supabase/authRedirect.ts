import * as Linking from 'expo-linking'
import type { User } from '../../types'
import { getSupabaseClient } from './client'
import { profileRowToUser } from './mappers'

const AUTH_CALLBACK_PATH = 'auth/callback'

/** Deep link Supabase should redirect to after email confirmation. */
export function getSupabaseAuthRedirectUrl(): string {
  return Linking.createURL(AUTH_CALLBACK_PATH)
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
  const parsed = Linking.parse(url)
  const path = parsed.path ?? ''
  return path.includes(AUTH_CALLBACK_PATH) || url.includes(`${AUTH_CALLBACK_PATH}`)
}

/** Exchange tokens from a confirmation/magic-link redirect into a Supabase session. */
export async function createSessionFromAuthRedirectUrl(
  url: string,
): Promise<{ user: User | null; error: string | null; confirmed: boolean }> {
  if (!isSupabaseAuthCallbackUrl(url)) {
    return { user: null, error: null, confirmed: false }
  }

  const params = parseUrlParams(url)
  const errorDescription = params.error_description || params.error
  if (errorDescription) {
    return { user: null, error: errorDescription, confirmed: false }
  }

  const accessToken = params.access_token
  const refreshToken = params.refresh_token
  if (!accessToken || !refreshToken) {
    return { user: null, error: null, confirmed: false }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return { user: null, error: 'Supabase is not configured.', confirmed: false }
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error) {
    return { user: null, error: error.message, confirmed: false }
  }

  const userId = data.session?.user.id
  if (!userId) {
    return { user: null, error: 'Email confirmed, but session could not start. Log in with your phone.', confirmed: true }
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    return { user: null, error: profileError.message, confirmed: true }
  }

  if (!profileRow) {
    return { user: null, error: 'Email confirmed, but profile was not found. Contact support.', confirmed: true }
  }

  return { user: profileRowToUser(profileRow), error: null, confirmed: true }
}
