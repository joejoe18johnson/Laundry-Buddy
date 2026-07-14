import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useApp } from '../context/AppContext'
import { formatHostPrice } from '../lib/hostFilters'
import type { Host } from '../types'
import { colors, coverColors, radius, spacing } from '../theme'
import { AppIcon } from './AppIcon'

function StatPill({
  icon,
  label,
  highlight,
}: {
  icon: 'star' | 'clock' | 'wind'
  label: string
  highlight?: boolean
}) {
  return (
    <View style={[styles.pill, highlight && styles.pillHighlight]}>
      <AppIcon name={icon} size={12} color={highlight ? colors.black : colors.gray500} />
      <Text style={[styles.pillText, highlight && styles.pillTextHighlight]}>{label}</Text>
    </View>
  )
}

export function HostCard({ host }: { host: Host }) {
  const { viewHostProfile } = useApp()
  const gradient = coverColors[host.id] ?? ['#667eea', '#764ba2']
  const initial = host.name.replace(/^Mr\. |^Mrs\. |^Don /, '').charAt(0).toUpperCase()
  const isFree = host.price <= 0

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => viewHostProfile(host)}
    >
      <View style={styles.topRow}>
        <LinearGradient
          colors={gradient}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </LinearGradient>

        <View style={styles.topMain}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {host.name}
            </Text>
            <View style={[styles.priceBadge, isFree && styles.priceBadgeFree]}>
              <Text style={[styles.price, isFree && styles.priceFree]}>
                {formatHostPrice(host.price)}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Text style={styles.location} numberOfLines={1}>
              {host.location}
              {host.district ? ` · ${host.district}` : ''}
            </Text>
          </View>

          {host.distanceKm != null && (
            <View style={styles.distanceChip}>
              <AppIcon name="navigation" size={11} color={colors.gray500} />
              <Text style={styles.distance}>{host.distanceKm} km away</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatPill
          icon="star"
          label={
            host.rating > 0
              ? `${host.rating.toFixed(1)}${host.reviewCount ? ` (${host.reviewCount})` : ''}`
              : 'New host'
          }
          highlight={host.rating >= 4.8}
        />
        <StatPill icon="clock" label={`${host.turnaroundHours} hr`} />
        <StatPill icon="wind" label={host.dryerType} />
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {host.hasGenerator && (
            <View style={styles.amenity}>
              <AppIcon name="zap" size={11} color={colors.gray600} />
              <Text style={styles.amenityText}>Generator</Text>
            </View>
          )}
          {host.foldingExtra != null && (
            <View style={styles.amenity}>
              <Text style={styles.amenityText}>Folding +${host.foldingExtra}</Text>
            </View>
          )}
          {!host.hasGenerator && host.foldingExtra == null && (
            <Text style={styles.perLoad}>per standard load</Text>
          )}
        </View>

        <View style={styles.slotsRow}>
          <View style={[styles.slotsDot, host.slotsLeft <= 1 && styles.slotsDotLow]} />
          <Text style={styles.slots}>
            {host.slotsLeft} slot{host.slotsLeft !== 1 ? 's' : ''} left
          </Text>
          <AppIcon name="chevron-right" size={16} color={colors.gray400} />
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.black,
  },
  cardPressed: {
    opacity: 0.96,
  },
  topRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.5,
  },
  topMain: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.black,
    letterSpacing: -0.3,
  },
  priceBadge: {
    backgroundColor: colors.gray50,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray100,
  },
  priceBadgeFree: {
    backgroundColor: colors.greenBg,
    borderColor: colors.green,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black,
    letterSpacing: -0.3,
  },
  priceFree: {
    color: colors.green,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: colors.gray600,
    fontWeight: '500',
    flex: 1,
  },
  distanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  distance: {
    fontSize: 12,
    color: colors.gray500,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.gray50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  pillHighlight: {
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray200,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray600,
  },
  pillTextHighlight: {
    color: colors.black,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray100,
    gap: spacing.sm,
  },
  footerLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray200,
  },
  amenityText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray600,
  },
  perLoad: {
    fontSize: 12,
    color: colors.gray400,
    fontWeight: '500',
  },
  slotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  slotsDotLow: {
    backgroundColor: colors.accent,
  },
  slots: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray600,
  },
})
