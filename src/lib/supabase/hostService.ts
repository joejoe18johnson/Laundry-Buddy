import type { Host, HostSettings, User } from '../../types'
import { buildHostFromUserSettings } from '../dynamicHosts'
import { applyHostPricing, getHostPricing } from '../hostPricing'
import { isIdentityVerified } from '../identityVerification'
import { normalizeHostSettings } from '../hostSettingsStorage'
import { resolveEffectiveHostOnline } from '../dropOffAvailability'
import { isSupabaseConfigured } from './config'
import { getSupabaseClient } from './client'
import type { Database, Json } from './database.types'

type HostRow = Database['public']['Tables']['hosts']['Row']
type HostSettingsRow = Database['public']['Tables']['host_settings']['Row']

function parseStringArray(value: Json | undefined): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

function isVerifiedIdentity(raw: Json | undefined): boolean {
  if (!raw || typeof raw !== 'object') return false
  const status = (raw as { status?: unknown }).status
  return status === 'verified'
}

export function hostRowToHost(row: HostRow): Host {
  return {
    id: row.id,
    hostUserId: row.host_user_id ?? undefined,
    name: row.name,
    location: row.location,
    district: row.district ?? undefined,
    rating: Number(row.rating) || 5,
    reviewCount: row.review_count ?? 0,
    price: Number(row.price) || 0,
    foldingPrice: row.folding_price != null ? Number(row.folding_price) : undefined,
    sheetsPrice: row.sheets_price != null ? Number(row.sheets_price) : undefined,
    slotsLeft: row.slots_left ?? 1,
    turnaroundHours: row.turnaround_hours ?? 24,
    dryerType: row.dryer_type ?? 'Standard',
    hasGenerator: row.has_generator ?? false,
    address: row.address,
    gateCode: row.gate_code ?? '',
    whatsapp: row.whatsapp ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    photos: parseStringArray(row.photos),
    rules: parseStringArray(row.rules),
  }
}

function hostSettingsFromJson(raw: Json | undefined, host?: Host | null): HostSettings {
  const parsed =
    raw && typeof raw === 'object' ? (raw as Partial<HostSettings>) : undefined
  return normalizeHostSettings(parsed, host)
}

export async function upsertHostListingToSupabase(
  user: User,
  host: Host,
  settings: HostSettings,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: true }
  if (!isIdentityVerified(user)) return { ok: true }
  if (!settings.listing.location.trim()) {
    return { ok: false, error: 'Add a listing location before going online.' }
  }

  const supabase = getSupabaseClient()
  if (!supabase) return { ok: false, error: 'Could not connect to Supabase.' }

  const listing = settings.listing
  const pricing = getHostPricing(host, settings)
  const payload: Database['public']['Tables']['hosts']['Insert'] = {
    id: host.id,
    host_user_id: user.id,
    name: host.name,
    location: host.location,
    district: host.district ?? null,
    rating: host.rating,
    review_count: host.reviewCount ?? 0,
    price: pricing.dryPrice,
    slots_left: host.slotsLeft,
    turnaround_hours: host.turnaroundHours,
    dryer_type: host.dryerType,
    has_generator: host.hasGenerator,
    folding_price: pricing.foldingPrice,
    sheets_price: pricing.sheetsPrice,
    address: host.address,
    gate_code: host.gateCode,
    photos: host.photos,
    rules: host.rules,
    whatsapp: host.whatsapp,
    latitude: host.latitude,
    longitude: host.longitude,
    bio: listing.bio.trim() || null,
    is_online: resolveEffectiveHostOnline(settings),
  }

  const { error: hostError } = await supabase.from('hosts').upsert(payload)
  if (hostError) return { ok: false, error: hostError.message }

  const settingsPayload: Database['public']['Tables']['host_settings']['Insert'] = {
    host_user_id: user.id,
    settings: settings as unknown as Json,
  }

  const { error: settingsError } = await supabase.from('host_settings').upsert(settingsPayload)
  if (settingsError) return { ok: false, error: settingsError.message }

  return { ok: true }
}

export async function fetchMarketplaceFromSupabase(): Promise<{
  hosts: Host[]
  settingsByUserId: Record<string, HostSettings>
}> {
  if (!isSupabaseConfigured()) {
    return { hosts: [], settingsByUserId: {} }
  }

  const supabase = getSupabaseClient()
  if (!supabase) return { hosts: [], settingsByUserId: {} }

  const { data: hostRows, error: hostError } = await supabase
    .from('hosts')
    .select('*')
    .eq('is_online', true)

  if (hostError || !hostRows?.length) {
    return { hosts: [], settingsByUserId: {} }
  }

  const userIds = hostRows
    .map((row) => row.host_user_id)
    .filter((entry): entry is string => !!entry)

  if (userIds.length === 0) {
    return { hosts: [], settingsByUserId: {} }
  }

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, identity_verification')
    .in('id', userIds)

  if (profileError) {
    return { hosts: [], settingsByUserId: {} }
  }

  const verifiedUserIds = new Set(
    (profileRows ?? [])
      .filter(
        (entry) => entry.role === 'host' && isVerifiedIdentity(entry.identity_verification),
      )
      .map((entry) => entry.id),
  )

  const visibleRows = hostRows.filter(
    (row) => row.host_user_id && verifiedUserIds.has(row.host_user_id) && row.location.trim(),
  )

  if (visibleRows.length === 0) {
    return { hosts: [], settingsByUserId: {} }
  }

  const visibleUserIds = visibleRows
    .map((row) => row.host_user_id!)
    .filter(Boolean)

  const { data: settingsRows, error: settingsError } = await supabase
    .from('host_settings')
    .select('host_user_id, settings')
    .in('host_user_id', visibleUserIds)

  const settingsByUserId: Record<string, HostSettings> = {}

  if (settingsError) {
    for (const row of visibleRows) {
      if (!row.host_user_id) continue
      settingsByUserId[row.host_user_id] = hostSettingsFromJson(undefined, hostRowToHost(row))
    }
  } else {
    for (const row of (settingsRows ?? []) as HostSettingsRow[]) {
      const host = visibleRows.find((entry) => entry.host_user_id === row.host_user_id)
      settingsByUserId[row.host_user_id] = hostSettingsFromJson(
        row.settings,
        host ? hostRowToHost(host) : null,
      )
    }

    for (const row of visibleRows) {
      if (!row.host_user_id || settingsByUserId[row.host_user_id]) continue
      settingsByUserId[row.host_user_id] = hostSettingsFromJson(undefined, hostRowToHost(row))
    }
  }

  const hosts = visibleRows.map((row) => {
    const host = hostRowToHost(row)
    const settings = row.host_user_id ? settingsByUserId[row.host_user_id] : undefined
    return settings ? applyHostPricing(host, settings) : host
  })

  return {
    hosts,
    settingsByUserId,
  }
}

export async function fetchHostListingFromSupabase(
  hostId: string,
  hostUserId?: string,
): Promise<{ host: Host; settings: HostSettings } | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = getSupabaseClient()
  if (!supabase) return null

  let query = supabase.from('hosts').select('*').eq('id', hostId).maybeSingle()
  let { data: row, error } = await query

  if ((error || !row) && hostUserId) {
    const byUser = await supabase
      .from('hosts')
      .select('*')
      .eq('host_user_id', hostUserId)
      .maybeSingle()
    row = byUser.data
    error = byUser.error
  }

  if (error || !row?.host_user_id) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, identity_verification')
    .eq('id', row.host_user_id)
    .maybeSingle()

  if (!profile || profile.role !== 'host' || !isVerifiedIdentity(profile.identity_verification)) {
    return null
  }

  const host = hostRowToHost(row)
  const { data: settingsRow } = await supabase
    .from('host_settings')
    .select('settings')
    .eq('host_user_id', row.host_user_id)
    .maybeSingle()

  const settings = hostSettingsFromJson(settingsRow?.settings, host)
  return {
    host: applyHostPricing(host, settings),
    settings,
  }
}

export function buildHostListingForSync(
  user: User,
  settings: HostSettings,
  existing?: Host | null,
): Host {
  return applyHostPricing(buildHostFromUserSettings(user, settings, existing), settings)
}
