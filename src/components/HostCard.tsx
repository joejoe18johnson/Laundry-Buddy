import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useApp } from '../context/AppContext'
import { formatHostDisplayName } from '../lib/displayName'
import { formatHostPrice } from '../lib/hostFilters'
import { isTopRatedHost } from '../lib/hostReputation'
import { toTitleCase } from '../lib/titleCase'
import { formatDryTimeInline } from '../lib/turnaroundTime'
import type { Host } from '../types'
import { colors, radius, spacing } from '../theme'
import { AppIcon } from './AppIcon'
import { HostAvatar } from './HostAvatar'
import { TopRatedHostBadge } from './TopRatedHostBadge'

export function HostCard({ host }: { host: Host }) {
  const { viewHostProfile, getReviewsForHost } = useApp()
  const isFree = host.price <= 0
  const reviews = getReviewsForHost(host.id)
  const topRated = isTopRatedHost(host, reviews)
  const displayName = formatHostDisplayName(host.name)

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => viewHostProfile(host)}
    >
      <HostAvatar host={host} size={48} />

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {topRated ? <TopRatedHostBadge compact /> : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {host.location}
          {host.district ? ` · ${host.district}` : ''}
        </Text>
        <Text style={styles.subMeta}>
          {host.rating > 0 ? `★ ${host.rating.toFixed(1)}` : toTitleCase('New Host')}
          {' · '}{formatDryTimeInline(host.turnaroundHours)}
          {host.foldingPrice != null && host.foldingPrice > 0 ? ` · ${toTitleCase('Folding')}` : ''}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.price, isFree && styles.priceFree]}>
          {formatHostPrice(host.price)}
        </Text>
        <Text style={styles.eta}>
          {host.distanceKm != null ? `${host.distanceKm} km` : toTitleCase('Nearby')}
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
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  cardPressed: {
    borderColor: colors.black,
    backgroundColor: colors.gray50,
  },
  body: { flex: 1, gap: 4, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  meta: { fontSize: 13, color: colors.gray600, fontWeight: '500' },
  subMeta: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 2 },
  price: { fontSize: 16, fontWeight: '700', color: colors.black },
  priceFree: { color: colors.green },
  eta: { fontSize: 12, fontWeight: '600', color: colors.gray500 },
})
