import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

type Props = {
  compact?: boolean
  /** For hero overlays on gradient backgrounds. */
  light?: boolean
}

export function TopRatedHostBadge({ compact = false, light = false }: Props) {
  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        light && styles.badgeLight,
      ]}
      accessibilityLabel={toTitleCase('Top rated host')}
    >
      <AppIcon name="star" size={compact ? 10 : 12} color={light ? colors.black : colors.white} />
      <Text style={[styles.text, compact && styles.textCompact, light && styles.textLight]}>
        {compact ? toTitleCase('Top Rated') : toTitleCase('Top Rated Host')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.black,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeLight: {
    backgroundColor: colors.white,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.2,
  },
  textCompact: {
    fontSize: 10,
  },
  textLight: {
    color: colors.black,
  },
})
