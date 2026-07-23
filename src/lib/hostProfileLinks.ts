import { Platform, Share } from 'react-native'
import { formatHostDisplayName } from './displayName'
import { hostIdForUser } from './dynamicHosts'
import { openWhatsAppShareText } from './whatsapp'
import type { Host } from '../types'

export type HostProfileShareTarget = {
  hostId: string
  hostUserId?: string
  hostName: string
}

const ANDROID_PACKAGE = 'com.laundrybuddy.app'

export function resolveHostShareTarget(host: Host | null | undefined, userId: string): HostProfileShareTarget {
  const hostId = host?.id ?? hostIdForUser(userId, host)
  return {
    hostId,
    hostUserId: host?.hostUserId ?? userId,
    hostName: host?.name ?? 'Host',
  }
}

function getSupabaseProjectUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()
  return url ? url.replace(/\/$/, '') : null
}

export function buildHostProfileDeepLink(target: HostProfileShareTarget): string {
  const params = new URLSearchParams()
  if (target.hostUserId) params.set('user', target.hostUserId)
  const query = params.toString()
  return `laundrybuddy://host/${encodeURIComponent(target.hostId)}${query ? `?${query}` : ''}`
}

/** Public HTTPS link — Edge Function serves HTML correctly (Storage forces text/plain). */
export function buildHostProfileWebUrl(target: HostProfileShareTarget): string | null {
  const base = getSupabaseProjectUrl()
  if (!base) return null
  const params = new URLSearchParams()
  params.set('host', target.hostId)
  if (target.hostUserId) params.set('user', target.hostUserId)
  return `${base}/functions/v1/host-profile?${params.toString()}`
}

/** Android intent URL — opens the installed app directly from browsers. */
export function buildHostProfileAndroidIntentUrl(
  target: HostProfileShareTarget,
  browserFallbackUrl?: string | null,
): string {
  const deepLink = buildHostProfileDeepLink(target)
  const intentPath = deepLink.replace(/^laundrybuddy:\/\//, '')
  const fallback = browserFallbackUrl ?? buildHostProfileWebUrl(target) ?? deepLink
  return `intent://${intentPath}#Intent;scheme=laundrybuddy;package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(fallback)};end`
}

export function buildHostProfileShareMessage(target: HostProfileShareTarget): string {
  const name = formatHostDisplayName(target.hostName)
  const webUrl = buildHostProfileWebUrl(target)
  const deepLink = buildHostProfileDeepLink(target)

  if (webUrl) {
    return `Book laundry with ${name} on Laundry Buddy:\n${webUrl}`
  }

  return `Book laundry with ${name} on Laundry Buddy:\n${deepLink}`
}

export function parseHostProfileLink(url: string | null | undefined): {
  hostId: string
  hostUserId?: string
} | null {
  if (!url) return null

  if (url.includes('host-profile.html') || url.includes('/functions/v1/host-profile')) {
    try {
      const parsed = new URL(url)
      const hostId = parsed.searchParams.get('host')?.trim()
      const hostUserId = parsed.searchParams.get('user')?.trim() || undefined
      if (hostId) return { hostId, hostUserId }
      if (hostUserId) return { hostId: hostIdForUser(hostUserId), hostUserId }
    } catch {
      return null
    }
    return null
  }

  if (url.startsWith('intent://') && url.includes('scheme=laundrybuddy')) {
    try {
      const pathMatch = url.match(/^intent:\/\/([^#]+)/i)
      if (!pathMatch) return null
      return parseHostProfileLink(`laundrybuddy://${pathMatch[1]}`)
    } catch {
      return null
    }
  }

  if (!url.startsWith('laundrybuddy://')) return null
  if (url.startsWith('laundrybuddy://auth')) return null

  const pathMatch = url.match(/^laundrybuddy:\/\/host\/([^?#]+)/i)
  if (pathMatch) {
    const hostId = decodeURIComponent(pathMatch[1])
    const query = url.split('?')[1]?.split('#')[0] ?? ''
    const hostUserId = new URLSearchParams(query).get('user')?.trim() || undefined
    return { hostId, hostUserId }
  }

  if (url.startsWith('laundrybuddy://host')) {
    const query = url.split('?')[1]?.split('#')[0] ?? ''
    const params = new URLSearchParams(query)
    const hostId = params.get('host')?.trim()
    const hostUserId = params.get('user')?.trim() || undefined
    if (hostId) return { hostId, hostUserId }
  }

  return null
}

export async function shareHostProfile(target: HostProfileShareTarget): Promise<boolean> {
  const message = buildHostProfileShareMessage(target)
  const webUrl = buildHostProfileWebUrl(target)
  const deepLink = buildHostProfileDeepLink(target)
  try {
    await Share.share({
      title: `${formatHostDisplayName(target.hostName)} on Laundry Buddy`,
      message,
      url: Platform.OS === 'ios' ? (webUrl ?? deepLink) : undefined,
    })
    return true
  } catch {
    return false
  }
}

export async function shareHostProfileViaWhatsApp(target: HostProfileShareTarget): Promise<boolean> {
  return openWhatsAppShareText(buildHostProfileShareMessage(target))
}
