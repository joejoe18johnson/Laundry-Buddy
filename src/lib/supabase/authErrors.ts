/** Turn Supabase Auth API errors into clearer messages for the app UI. */
export function formatSupabaseAuthError(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
    return [
      'Too many confirmation emails were sent recently.',
      'Supabase allows about 2 auth emails per hour on the free built-in mailer.',
      'Wait an hour, use a confirmation link already in your inbox, or in Supabase turn off Confirm email under Authentication → Providers → Email for testing.',
    ].join(' ')
  }

  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'This email is already registered. Log in with your phone and password, or check your inbox for an earlier confirmation link.'
  }

  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Confirm your email first — check your inbox for the Laundry Buddy link, then log in with your phone and password.'
  }

  return message
}
