/** Supabase project URL — set in `.env` or EAS build env. */
export function getSupabaseUrl(): string | undefined {
  const value = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()
  return value || undefined
}

/** Supabase anon (public) key — safe to ship in the mobile app with RLS enabled. */
export function getSupabaseAnonKey(): string | undefined {
  const value = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim()
  return value || undefined
}

/** True when both URL and anon key are present — app uses Supabase instead of local AsyncStorage auth. */
export function isSupabaseConfigured(): boolean {
  return !!(getSupabaseUrl() && getSupabaseAnonKey())
}

/** Synthetic auth email for phone-first sign-in (Supabase Auth requires an email). */
export function authEmailFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `${digits}@phone.laundrybuddy.app`
}
