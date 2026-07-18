import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { useTheme } from '../context/ThemeContext'
import { toTitleCase } from '../lib/titleCase'
import { radius, spacing } from '../theme'

type Props = {
  onPress: () => void
  compact?: boolean
  confirmed?: boolean
}

export function PaymentProofChip({ onPress, compact, confirmed }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          borderWidth: 1,
          borderColor: confirmed ? colors.green : colors.gray200,
          backgroundColor: confirmed ? colors.greenBg : colors.gray50,
          borderRadius: radius.md,
          paddingVertical: compact ? 8 : 10,
          paddingHorizontal: spacing.md,
        },
        copy: { flex: 1, gap: 2 },
        title: { fontSize: 13, fontWeight: '700', color: colors.black },
        sub: { fontSize: 12, color: colors.gray600 },
        action: { fontSize: 12, fontWeight: '700', color: colors.black },
      }),
    [colors, compact, confirmed],
  )

  return (
    <Pressable
      onPress={onPress}
      style={styles.chip}
      accessibilityRole="button"
      accessibilityLabel="View transfer proof"
    >
      <AppIcon name="file-text" size={18} color={confirmed ? colors.green : colors.black} />
      <View style={styles.copy}>
        <Text style={styles.title}>
          {toTitleCase(confirmed ? 'Transfer proof · verified' : 'Transfer proof attached')}
        </Text>
        {!compact ? (
          <Text style={styles.sub}>{toTitleCase('Receipt saved on this load — tap to view full screenshot.')}</Text>
        ) : null}
      </View>
      <Text style={styles.action}>{toTitleCase('View')}</Text>
    </Pressable>
  )
}
