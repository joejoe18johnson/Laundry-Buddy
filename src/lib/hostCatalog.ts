import { isIdentityVerified } from './identityVerification'
import { applyHostSettings } from './hostListing'
import {
  buildHostFromUserSettings,
  loadDynamicHosts,
  saveDynamicHosts,
  setRuntimeDynamicHosts,
} from './dynamicHosts'
import { fetchMarketplaceFromSupabase } from './supabase/hostService'
import { isSupabaseConfigured } from './supabase'
import { resolveUserById } from './adminUsers'
import type { Host, HostSettings } from '../types'

/** Rebuild the marketplace host catalog from saved host settings + verified profiles. */
export async function refreshDynamicHostCatalog(
  hostSettingsMap: Record<string, HostSettings>,
): Promise<Host[]> {
  const stored = await loadDynamicHosts()
  const storedByUserId = new Map(
    stored.filter((entry) => entry.hostUserId).map((entry) => [entry.hostUserId!, entry]),
  )
  const next: Host[] = []
  const seenUserIds = new Set<string>()

  for (const [userId, settings] of Object.entries(hostSettingsMap)) {
    const profile = await resolveUserById(userId)
    if (!profile || profile.role !== 'host' || !isIdentityVerified(profile)) continue
    if (!settings.listing.location.trim()) continue

    const existing = storedByUserId.get(userId) ?? null
    next.push(applyHostSettings(buildHostFromUserSettings(profile, settings, existing), settings))
    seenUserIds.add(userId)
  }

  for (const entry of stored) {
    if (!entry.hostUserId || seenUserIds.has(entry.hostUserId)) continue
    const profile = await resolveUserById(entry.hostUserId)
    if (!profile || profile.role !== 'host' || !isIdentityVerified(profile)) continue
    next.push(entry)
  }

  await saveDynamicHosts(next)
  setRuntimeDynamicHosts(next)
  return next
}

/** Merge local listings with Supabase marketplace rows so every device sees the same online hosts. */
export async function mergeRemoteMarketplaceCatalog(
  localSettingsMap: Record<string, HostSettings>,
): Promise<{ settingsMap: Record<string, HostSettings>; hosts: Host[] }> {
  const localHosts = await refreshDynamicHostCatalog(localSettingsMap)

  if (!isSupabaseConfigured()) {
    return { settingsMap: localSettingsMap, hosts: localHosts }
  }

  const remote = await fetchMarketplaceFromSupabase()
  const settingsMap = { ...remote.settingsByUserId, ...localSettingsMap }

  const merged = new Map<string, Host>()
  for (const host of localHosts) {
    const key = host.hostUserId ?? host.id
    const settings = host.hostUserId ? settingsMap[host.hostUserId] : undefined
    merged.set(key, applyHostSettings(host, settings))
  }
  for (const host of remote.hosts) {
    const key = host.hostUserId ?? host.id
    const settings = host.hostUserId ? settingsMap[host.hostUserId] : undefined
    merged.set(key, applyHostSettings(host, settings))
  }

  const hosts = Array.from(merged.values())
  await saveDynamicHosts(hosts)
  setRuntimeDynamicHosts(hosts)
  return { settingsMap, hosts }
}

export async function syncDynamicHostForUser(
  userId: string,
  hostSettingsMap: Record<string, HostSettings>,
): Promise<Host | null> {
  const { hosts } = await mergeRemoteMarketplaceCatalog(hostSettingsMap)
  return hosts.find((entry) => entry.hostUserId === userId) ?? null
}
