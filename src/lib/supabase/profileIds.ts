import type { User } from '../../types'
import { normalizePhone } from '../phone'
import { getSupabaseClient } from './client'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isSupabaseProfileId(id: string): boolean {
  return UUID_PATTERN.test(id)
}

/** Map a local/training user id to the Supabase profiles row id (phone, then email). */
export async function resolveSupabaseProfileId(
  user: Pick<User, 'id' | 'phone' | 'email'>,
): Promise<string | null> {
  if (isSupabaseProfileId(user.id)) return user.id

  const supabase = getSupabaseClient()
  if (!supabase) return null

  if (user.phone) {
    const normalized = normalizePhone(user.phone)
    const { data } = await supabase.from('profiles').select('id').eq('phone', normalized).maybeSingle()
    if (data?.id) return data.id
  }

  if (user.email) {
    const email = user.email.trim().toLowerCase()
    const { data } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
    if (data?.id) return data.id
  }

  return null
}

export function userContactKey(user: Pick<User, 'phone' | 'email'>): string | null {
  if (user.phone) return `phone:${normalizePhone(user.phone)}`
  if (user.email) return `email:${user.email.trim().toLowerCase()}`
  return null
}
