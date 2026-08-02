import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../AppIcon'
import { useTheme } from '../../context/ThemeContext'
import { formatCurrency } from '../../lib/bookingPayments'
import type { HostBusinessStats } from '../../lib/hostBusinessStats'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'

function StatTile({
  label,
  value,
  styles,
}: {
  label: string
  value: string
  styles: ReturnType<typeof createStyles>
}) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: colors.black,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    headerLeft: { flex: 1, gap: 2 },
    title: { fontSize: 13, fontWeight: '700', color: colors.gray500, letterSpacing: 0.4 },
    subtitle: { fontSize: 12, color: colors.gray500, lineHeight: 17 },
    historyLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    historyLinkText: { fontSize: 12, fontWeight: '600', color: colors.gray600 },
    hero: { gap: 4 },
    heroLabel: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
    heroAmount: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5, color: colors.black },
    heroAmountMuted: { color: colors.gray400 },
    tiles: { flexDirection: 'row', gap: spacing.sm },
    tile: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.gray100,
      backgroundColor: colors.gray50,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      gap: 2,
    },
    tileValue: { fontSize: 16, fontWeight: '700', color: colors.black },
    tileLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.gray500,
      textAlign: 'center',
      lineHeight: 13,
    },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.gray50,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    pillLive: { backgroundColor: colors.greenBg, borderColor: colors.green },
    pillText: { fontSize: 12, fontWeight: '600', color: colors.gray600 },
    pillLiveText: { color: colors.gray600 },
  })
}

export function HostBusinessSnapshot({
  stats,
  accepting,
  onPressHistory,
  showStatus = false,
}: {
  stats: HostBusinessStats
  accepting?: boolean
  onPressHistory?: () => void
  showStatus?: boolean
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const hasEarnings = stats.totalEarned > 0 || stats.completedLoads > 0

  const content = (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{toTitleCase('Your business snapshot')}</Text>
          <Text style={styles.subtitle}>
            {toTitleCase('Loads hosted and money earned on Laundry Buddy')}
          </Text>
        </View>
        {onPressHistory ? (
          <View style={styles.historyLink}>
            <Text style={styles.historyLinkText}>{toTitleCase('History')}</Text>
            <AppIcon name="chevron-right" size={14} color={colors.gray600} />
          </View>
        ) : null}
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>{toTitleCase('Total earned')}</Text>
        <Text style={[styles.heroAmount, !hasEarnings && styles.heroAmountMuted]}>
          {formatCurrency(stats.totalEarned)}
        </Text>
      </View>

      <View style={styles.tiles}>
        <StatTile
          label={toTitleCase('Loads done')}
          value={String(stats.loadsHosted)}
          styles={styles}
        />
        <StatTile
          label={toTitleCase('Earned today')}
          value={formatCurrency(stats.earnedToday)}
          styles={styles}
        />
        <StatTile
          label={toTitleCase('Loads today')}
          value={String(stats.loadsToday)}
          styles={styles}
        />
      </View>

      {showStatus && accepting != null ? (
        <View style={styles.statusRow}>
          <View style={[styles.pill, accepting ? styles.pillLive : null]}>
            <AppIcon
              name={accepting ? 'check-circle' : 'x-circle'}
              size={12}
              color={accepting ? colors.green : colors.gray600}
            />
            <Text style={[styles.pillText, accepting ? styles.pillLiveText : null]}>
              {accepting ? toTitleCase('Accepting loads') : toTitleCase('Full today')}
            </Text>
          </View>
          {stats.completedLoads > 0 ? (
            <Text style={styles.subtitle}>
              {stats.paidLoads} {toTitleCase('paid')} · {stats.completedLoads}{' '}
              {toTitleCase('completed')}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )

  if (onPressHistory) {
    return (
      <Pressable onPress={onPressHistory} accessibilityRole="button">
        {content}
      </Pressable>
    )
  }

  return content
}
