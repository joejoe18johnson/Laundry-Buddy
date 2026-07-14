import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View, type ViewStyle } from 'react-native'
import type { Host } from '../types'
import { colors, coverColors, radius } from '../theme'

type Props = {
  host: Host
  size?: number
  style?: ViewStyle
}

export function getHostInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function HostAvatar({ host, size = 48, style }: Props) {
  const gradient = coverColors[host.id] ?? ['#1a1a1a', '#404040']
  const fontSize = size <= 36 ? 13 : size <= 44 ? 15 : 17

  return (
    <LinearGradient
      colors={gradient}
      style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.28 }, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={[styles.initials, { fontSize }]}>{getHostInitials(host.name)}</Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3,
  },
})
