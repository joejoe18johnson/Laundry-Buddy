import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { formatRadiusMilesLabel, RADIUS_OPTIONS_MILES } from '../lib/locationPreferences'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

type Props = {
  radiusMiles: number
  onPress: () => void
}

function radiusOptionsHint(): string {
  const miles = RADIUS_OPTIONS_MILES
  if (miles.length <= 1) return formatRadiusMilesLabel(miles[0] ?? 1)
  const head = miles.slice(0, -1).map((value) => `${value}`).join(', ')
  return `${head} or ${miles[miles.length - 1]} mi`
}

export function SearchRadiusButton({ radiusMiles, onPress }: Props) {
  const optionsHint = radiusOptionsHint()

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Search radius, ${formatRadiusMilesLabel(radiusMiles)}`}
      accessibilityHint={`Opens options: ${optionsHint}`}
    >
      <View style={styles.iconWrap}>
        <AppIcon name="disc" size={16} color={colors.black} />
      </View>
      <View style={styles.copy}>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{formatRadiusMilesLabel(radiusMiles)}</Text>
          <Text style={styles.label}>{toTitleCase('radius')}</Text>
        </View>
        <Text style={styles.hint}>{toTitleCase(`${optionsHint} — tap to choose`)}</Text>
      </View>
      <View style={styles.chevronWrap}>
        <AppIcon name="chevron-down" size={18} color={colors.gray500} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    minWidth: 0,
  },
  pressed: { opacity: 0.85, backgroundColor: colors.gray50 },
  iconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' },
  value: { fontSize: 14, fontWeight: '700', color: colors.black },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  hint: { fontSize: 11, fontWeight: '500', color: colors.gray400, lineHeight: 14 },
  chevronWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
