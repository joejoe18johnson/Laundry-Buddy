import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { colors, radius, spacing } from '../theme'
import { toTitleCase, titleCaseWithName } from '../lib/titleCase'
import type { BiometricSupport } from '../lib/biometricAuth'

type Props = {
  support: BiometricSupport
  onPress: () => void
  loading?: boolean
  variant?: 'primary' | 'outline'
}

export function BiometricLoginButton({
  support,
  onPress,
  loading = false,
  variant = 'outline',
}: Props) {
  const isPrimary = variant === 'primary'

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnOutline,
        pressed && !loading && styles.pressed,
        loading && styles.loading,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Sign in with ${support.label}`}
    >
      <View style={styles.content}>
        <AppIcon
          name={support.icon}
          size={20}
          color={isPrimary ? colors.white : colors.black}
        />
        <Text style={[styles.label, isPrimary && styles.labelPrimary]}>
          {loading
            ? toTitleCase('Checking…')
            : titleCaseWithName(`Continue with ${support.label}`, support.label)}
        </Text>
      </View>
    </Pressable>
  )
}

export function BiometricDivider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{toTitleCase('or')}</Text>
      <View style={styles.dividerLine} />
    </View>
  )
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.pill,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.black,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.black,
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.88 },
  loading: { opacity: 0.6 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  labelPrimary: {
    color: colors.white,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray400,
  },
})
