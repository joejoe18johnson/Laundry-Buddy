import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import { OutlineButton, PrimaryButton } from './ui'
import type { BiometricSupport } from '../lib/biometricAuth'
import { titleCaseWithName, toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

type Props = {
  visible: boolean
  support: BiometricSupport
  loading?: boolean
  onEnable: () => void
  onSkip: () => void
}

export function BiometricSetupPrompt({ visible, support, loading, onEnable, onSkip }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <Pressable style={styles.overlay} onPress={onSkip}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.iconCircle}>
              <AppIcon name={support.icon} size={28} color={colors.black} />
            </View>
            <Text style={styles.title}>
              {titleCaseWithName(`Use ${support.label} next time?`, support.label)}
            </Text>
            <Text style={styles.subtitle}>
              {titleCaseWithName(
                `Skip typing your password — use ${support.label} when you log back in after signing out.`,
                support.label,
              )}
            </Text>
            <PrimaryButton
              title={loading ? 'Setting up…' : `Enable ${support.label}`}
              icon={support.icon}
              onPress={onEnable}
              disabled={loading}
              full
            />
            <View style={{ height: spacing.sm }} />
            <OutlineButton title="Not now" onPress={onSkip} full />
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.black,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
})
