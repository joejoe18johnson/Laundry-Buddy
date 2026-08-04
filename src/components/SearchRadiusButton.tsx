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
      accessibilityHint="Opens radius options"
    >
      <Text style={styles.label}>{toTitleCase('Search radius')}</Text>
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
    justifyContent: 'space-between',
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
  label: { fontSize: 14, fontWeight: '600', color: colors.black, flex: 1 },
  chevronWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
