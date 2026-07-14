import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useApp } from '../context/AppContext'
import { formatHostPrice } from '../lib/hostFilters'
import type { Host } from '../types'
import { colors, coverColors, radius, spacing } from '../theme'
import { AppIcon } from './AppIcon'

export function HostCard({ host }: { host: Host }) {
  const { viewHostProfile } = useApp()
  const gradient = coverColors[host.id] ?? ['#667eea', '#764ba2']

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => viewHostProfile(host)}
    >
      <View style={styles.cardInner}>
        <LinearGradient colors={gradient} style={styles.accent} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />

        <View style={styles.content}>
          <View style={styles.main}>
            <Text style={styles.name}>{host.name}</Text>
            <View style={styles.locationRow}>
              <AppIcon name="map-pin" size={14} color={colors.gray500} />
              <Text style={styles.location}>
                {host.location}
                {host.district ? ` · ${host.district}` : ''}
              </Text>
              {host.distanceKm != null && (
                <Text style={styles.distance}> · {host.distanceKm} km</Text>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <AppIcon name="star" size={13} color={colors.black} />
                <Text style={styles.statText}>
                  {host.rating > 0 ? host.rating.toFixed(1) : 'New'}
                  {host.reviewCount ? ` (${host.reviewCount})` : ''}
                </Text>
              </View>
              <View style={styles.statDot} />
              <View style={styles.stat}>
                <AppIcon name="clock" size={13} color={colors.gray600} />
                <Text style={styles.statText}>{host.turnaroundHours} hr dry</Text>
              </View>
              <View style={styles.statDot} />
              <Text style={styles.statText}>{host.dryerType}</Text>
            </View>

            {(host.hasGenerator || host.foldingExtra != null) && (
              <View style={styles.tags}>
                {host.hasGenerator && (
                  <View style={styles.tag}>
                    <AppIcon name="zap" size={11} />
                    <Text style={styles.tagText}>Generator</Text>
                  </View>
                )}
                {host.foldingExtra != null && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Folding +${host.foldingExtra}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.priceCol}>
            <Text style={[styles.price, host.price <= 0 && styles.priceFree]}>
              {formatHostPrice(host.price)}
            </Text>
            <Text style={styles.priceUnit}>per load</Text>
            <Text style={styles.slots}>{host.slotsLeft} slots</Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.94 },
  cardInner: { flexDirection: 'row' },
  accent: { width: 4 },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  main: { flex: 1, gap: spacing.sm },
  name: { fontSize: 17, fontWeight: '700', color: colors.black },
  locationRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  location: { fontSize: 14, color: colors.gray600, fontWeight: '500' },
  distance: { fontSize: 14, color: colors.gray400 },
  statsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: colors.gray600 },
  statDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.gray200 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gray50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tagText: { fontSize: 11, fontWeight: '500', color: colors.gray600 },
  priceCol: { alignItems: 'flex-end', minWidth: 64 },
  price: { fontSize: 22, fontWeight: '700', color: colors.black, letterSpacing: -0.5 },
  priceFree: { fontSize: 20, color: colors.green },
  priceUnit: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  slots: { fontSize: 11, color: colors.gray400, marginTop: spacing.sm },
})
