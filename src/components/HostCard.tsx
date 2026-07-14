import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useApp } from '../context/AppContext'
import { formatHostPrice } from '../lib/hostFilters'
import type { Host } from '../types'
import { colors, coverColors, radius, spacing } from '../theme'
import { AppIcon } from './AppIcon'

export function HostCard({ host }: { host: Host }) {
  const { viewHostProfile } = useApp()
  const gradient = coverColors[host.id] ?? ['#1a1a1a', '#404040']
  const isFree = host.price <= 0

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => viewHostProfile(host)}
    >
      <LinearGradient
        colors={gradient}
        style={styles.iconBox}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AppIcon name="wind" size={18} color={colors.white} />
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {host.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {host.location}
          {host.district ? ` · ${host.district}` : ''}
        </Text>
        <Text style={styles.subMeta}>
          {host.rating > 0 ? `★ ${host.rating.toFixed(1)}` : 'New host'}
          {' · '}{host.turnaroundHours} hr dry
          {host.foldingPrice != null && host.foldingPrice > 0 ? ' · Folding' : ''}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.price, isFree && styles.priceFree]}>
          {formatHostPrice(host.price)}
        </Text>
        <Text style={styles.eta}>
          {host.distanceKm != null ? `${host.distanceKm} km` : 'Nearby'}
        </Text>
        <AppIcon name="chevron-right" size={18} color={colors.gray400} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  cardPressed: {
    borderColor: colors.black,
    backgroundColor: colors.gray50,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2, minWidth: 0 },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    letterSpacing: -0.2,
  },
  meta: { fontSize: 13, color: colors.gray600, fontWeight: '500' },
  subMeta: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 2 },
  price: { fontSize: 16, fontWeight: '700', color: colors.black },
  priceFree: { color: colors.green },
  eta: { fontSize: 12, fontWeight: '600', color: colors.gray500 },
})
