import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

type Props = {
  onPress: () => void
  loading?: boolean
  locationLabel?: string
}

export function CloseToMeButton({ onPress, loading = false, locationLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.wrap, pressed && !loading && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Close to me, use GPS location"
    >
      <View style={styles.iconWrap}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.black} />
        ) : (
          <AppIcon name="navigation" size={16} color={colors.black} />
        )}
      </View>
      <Text style={styles.label}>{toTitleCase('Close to Me')}</Text>
      {locationLabel ? (
        <Text style={styles.hint} numberOfLines={1}>
          · {locationLabel}
        </Text>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.black },
  hint: { flexShrink: 1, fontSize: 13, fontWeight: '500', color: colors.gray500 },
})
