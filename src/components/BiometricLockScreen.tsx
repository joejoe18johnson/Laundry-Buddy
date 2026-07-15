import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import { PrimaryButton } from './ui'
import { authenticateBiometric, type BiometricSupport } from '../lib/biometricAuth'
import { colors, spacing } from '../theme'

type Props = {
  visible: boolean
  support: BiometricSupport
  onUnlock: () => void
  onUsePassword: () => void
}

export function BiometricLockScreen({ visible, support, onUnlock, onUsePassword }: Props) {
  const [checking, setChecking] = useState(false)

  const tryUnlock = async () => {
    setChecking(true)
    const ok = await authenticateBiometric(`Unlock with ${support.label}`)
    setChecking(false)
    if (ok) onUnlock()
  }

  useEffect(() => {
    if (!visible) return
    void tryUnlock()
  }, [visible])

  if (!visible) return null

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <AppIcon name={support.icon} size={32} color={colors.black} />
          </View>
          <Text style={styles.title}>Laundry Buddy is locked</Text>
          <Text style={styles.subtitle}>Use {support.label} to pick up where you left off</Text>
          <PrimaryButton
            title={checking ? 'Checking…' : `Unlock with ${support.label}`}
            icon={support.icon}
            onPress={tryUnlock}
            disabled={checking}
            full
          />
          <Pressable onPress={onUsePassword} hitSlop={8} style={styles.passwordLink}>
            <Text style={styles.passwordText}>Use password instead</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
    zIndex: 100,
  },
  safe: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
    gap: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.black,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  passwordLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  passwordText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray600,
    textDecorationLine: 'underline',
  },
})
