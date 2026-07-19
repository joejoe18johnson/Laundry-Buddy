import { isIdentityVerified } from './identityVerification'
import {
  buildHostFromUserSettings,
  loadDynamicHosts,
  saveDynamicHosts,
  setRuntimeDynamicHosts,
} from './dynamicHosts'
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
    next.push(buildHostFromUserSettings(profile, settings, existing))
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

export async function syncDynamicHostForUser(
  userId: string,
  hostSettingsMap: Record<string, HostSettings>,
): Promise<Host | null> {
  const hosts = await refreshDynamicHostCatalog(hostSettingsMap)
  return hosts.find((entry) => entry.hostUserId === userId) ?? null
}
