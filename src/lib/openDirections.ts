import { Linking, Platform } from 'react-native'

type DirectionsTarget = {
  latitude?: number
  longitude?: number
  label?: string
  address?: string
}

function hasCoordinates(target: DirectionsTarget): target is DirectionsTarget & {
  latitude: number
  longitude: number
} {
  return target.latitude != null && target.longitude != null
}

function buildFallbackUrl(target: DirectionsTarget): string {
  if (hasCoordinates(target)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`
  }
  if (target.address?.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target.address)}`
  }
  return 'https://www.google.com/maps'
}

function buildPrimaryUrl(target: DirectionsTarget): string | null {
  if (hasCoordinates(target)) {
    const { latitude, longitude } = target
    if (Platform.OS === 'ios') {
      return `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`
    }
    return `google.navigation:q=${latitude},${longitude}&mode=d`
  }
  if (target.address?.trim()) {
    const query = encodeURIComponent(target.address)
    if (Platform.OS === 'ios') {
      return `http://maps.apple.com/?daddr=${query}&dirflg=d`
    }
    return `google.navigation:q=${query}&mode=d`
  }
  return null
}

/** Open driving directions in Apple Maps (iOS) or Google Maps (Android). */
export async function openDirections(target: DirectionsTarget): Promise<void> {
  const primary = buildPrimaryUrl(target)
  const fallback = buildFallbackUrl(target)

  if (primary) {
    try {
      const supported = await Linking.canOpenURL(primary)
      if (supported) {
        await Linking.openURL(primary)
        return
      }
    } catch {
      // try fallback below
    }
  }

  await Linking.openURL(fallback)
}

export function openHostDirections(host: {
  latitude: number
  longitude: number
  name: string
  address: string
}): Promise<void> {
  return openDirections({
    latitude: host.latitude,
    longitude: host.longitude,
    label: host.name,
    address: host.address,
  })
}
