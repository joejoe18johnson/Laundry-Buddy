import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useApp } from '../context/AppContext'
import type { Host } from '../types'
import { colors, coverColors, radius, spacing } from '../theme'
import { AppIcon } from './AppIcon'
import { PrimaryButton } from './ui'

export function HostCard({ host }: { host: Host }) {
  const { viewHostProfile } = useApp()
  const gradient = coverColors[host.id] ?? ['#667eea', '#764ba2']

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => viewHostProfile(host)}
    >
      <LinearGradient colors={gradient} style={styles.cover} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.badge}>
          <AppIcon name="gift" size={12} />
          <Text style={styles.badgeText}>Free</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.row}>
          <View style={styles.titleRow}>
            <AppIcon name="map-pin" size={16} color={colors.black} />
            <Text style={styles.title}>{host.location}</Text>
          </View>
          <View style={styles.ratingRow}>
            <AppIcon name="star" size={14} color={colors.black} />
            <Text style={styles.rating}>
              {host.rating > 0 ? host.rating.toFixed(1) : 'New'}
              {host.reviewCount ? ` (${host.reviewCount})` : ''}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <AppIcon name="user" size={14} color={colors.gray500} />
          <Text style={styles.subtitle}>Hosted by {host.name}</Text>
          <AppIcon name="chevron-right" size={16} color={colors.gray400} />
        </View>
        <View style={styles.metaRow}>
          <AppIcon name="clock" size={14} color={colors.gray500} />
          <Text style={styles.meta}>
            {host.slotsLeft} slots · ~{host.turnaroundHours} hr · {host.dryerType}
            {host.distanceKm != null ? ` · ${host.distanceKm} km` : ''}
          </Text>
        </View>
        <View style={styles.tags}>
          {host.hasGenerator && (
            <View style={styles.tagAccent}>
              <AppIcon name="zap" size={12} />
              <Text style={styles.tagAccentText}>Generator</Text>
            </View>
          )}
          {host.foldingExtra != null && (
            <View style={styles.tag}>
              <AppIcon name="layers" size={12} color={colors.gray600} />
              <Text style={styles.tagText}>Folding +${host.foldingExtra}</Text>
            </View>
          )}
        </View>
        <View style={styles.ctaHint}>
          <Text style={styles.ctaHintText}>View profile & reviews</Text>
          <AppIcon name="arrow-right" size={14} color={colors.gray500} />
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  cardPressed: { opacity: 0.92 },
  cover: { height: 160, justifyContent: 'flex-start', padding: spacing.md },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  body: { padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  title: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 14, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  subtitle: { fontSize: 14, color: colors.gray500, lineHeight: 20, flex: 1 },
  meta: { fontSize: 14, color: colors.gray500, lineHeight: 20, flex: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tagText: { fontSize: 12, color: colors.gray600 },
  tagAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tagAccentText: { fontSize: 12, fontWeight: '500' },
  ctaHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  ctaHintText: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
})
