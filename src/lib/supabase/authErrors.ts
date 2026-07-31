/** Turn Supabase Auth API errors into clearer messages for the app UI. */
export function formatSupabaseAuthError(message: string): string {
  const sanitized = sanitizeRawErrorMessage(message)
  const lower = sanitized.toLowerCase()

  if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
    return [
      'Too many confirmation emails were sent recently.',
      'Supabase allows about 2 auth emails per hour on the free built-in mailer.',
      'Wait an hour, use a confirmation link already in your inbox, or in Supabase turn off Confirm email under Authentication → Providers → Email for testing.',
    ].join(' ')
  }

  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'This email is already registered. Log in with your email and password, or use Forgot password.'
  }

  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Confirm your email first — check your inbox for the Laundry Buddy link, then log in with your email and password.'
  }

  if (lower.includes('unexpected_failure') || lower.includes('database error saving new user')) {
    return [
      'We could not create your account.',
      'This phone or email may already be registered — try logging in.',
      'If the problem continues, contact support.',
    ].join(' ')
  }

  if (lower.includes('phone number already registered') || lower.includes('profiles_phone')) {
    return 'This phone number is already registered. Log in instead.'
  }

  if (lower.includes('email already registered') || lower.includes('profiles_email')) {
    return 'This email is already registered. Log in instead.'
  }

  if (lower.includes('invalid input value for enum app_role')) {
    return 'Account setup is incomplete on the server. Contact support.'
  }

  return sanitized
}

function sanitizeRawErrorMessage(message: string): string {
  const trimmed = message.trim()
  if (!trimmed) return 'Something went wrong. Try again.'

  const looksLikeFetchResponse =
    trimmed.includes('_bodyBlob') ||
    trimmed.includes('_bodyInit') ||
    (trimmed.includes('"status":500') && trimmed.includes('supabase.co/auth/v1/signup'))

  if (looksLikeFetchResponse) {
    return 'unexpected_failure'
  }

  if (trimmed.startsWith('{') && trimmed.includes('"status"')) {
    try {
      const parsed = JSON.parse(trimmed) as { status?: number; url?: string }
      if (parsed.status === 500 && parsed.url?.includes('/auth/v1/signup')) {
        return 'unexpected_failure'
      }
    } catch {
      // Fall through to the raw message.
    }
  }

  return trimmed
}

function extractErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong. Try again.'
  if (typeof error === 'string') return error

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>
    if (typeof record.message === 'string') return record.message
    if (typeof record.error_description === 'string') return record.error_description
    if (typeof record.msg === 'string') return record.msg
  }

  return 'Something went wrong. Try again.'
}

/** Normalize any Supabase/PostgREST/auth error into user-facing copy. */
export function normalizeSupabaseError(error: unknown): string {
  return formatSupabaseAuthError(extractErrorMessage(error))
}
