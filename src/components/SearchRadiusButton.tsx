import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { formatRadiusMilesLabel } from '../lib/locationPreferences'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

type Props = {
  radiusMiles: number
  onPress: () => void
}

export function SearchRadiusButton({ radiusMiles, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Search radius, ${formatRadiusMilesLabel(radiusMiles)}`}
    >
      <View style={styles.iconWrap}>
        <AppIcon name="disc" size={16} color={colors.black} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{toTitleCase('Search radius')}</Text>
        <Text style={styles.value}>{formatRadiusMilesLabel(radiusMiles)}</Text>
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
    backgroundColor: colors.gray50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.gray100,
    minWidth: 0,
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  label: { fontSize: 12, fontWeight: '600', color: colors.gray500 },
  value: { fontSize: 14, fontWeight: '700', color: colors.black },
})
