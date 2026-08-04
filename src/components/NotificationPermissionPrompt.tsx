import { Modal, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import { PrimaryButton, OutlineButton } from './ui'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

type Props = {
  visible: boolean
  /** OS will no longer show the native Allow dialog — only then offer Settings. */
  blockedInSettings?: boolean
  onAllow: () => void
  onOpenSettings?: () => void
  onDismiss: () => void
}

/**
 * Explains why notifications matter, then the primary button opens the native
 * Allow / Don't allow dialog (Facebook / YouTube style). Settings is only
 * offered when the OS will not show that dialog again.
 */
export function NotificationPermissionPrompt({
  visible,
  blockedInSettings = false,
  onAllow,
  onOpenSettings,
  onDismiss,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheetWrap} edges={['bottom']}>
          <View style={styles.sheet}>
            <View style={styles.iconWrap}>
              <AppIcon name="bell" size={28} color={colors.white} />
            </View>
            <Text style={styles.title}>
              {toTitleCase(
                blockedInSettings ? 'Turn notifications back on' : 'Allow notifications',
              )}
            </Text>
            <Text style={styles.body}>
              {toTitleCase(
                blockedInSettings
                  ? 'Notifications are off for Laundry Buddy. Open your phone settings to turn them on — you will miss booking and message alerts otherwise.'
                  : 'Tap Allow on the next screen so you never miss booking updates, verification results, or new messages. One tap and you are done.',
              )}
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• {toTitleCase('Host accepts, declines, or updates your load')}</Text>
              <Text style={styles.listItem}>• {toTitleCase('Verification approved or needs resubmit')}</Text>
              <Text style={styles.listItem}>• {toTitleCase('New messages from your host or guest')}</Text>
            </View>
            {blockedInSettings ? (
              <PrimaryButton
                title="Open phone settings"
                icon="settings"
                full
                onPress={onOpenSettings ?? onAllow}
              />
            ) : (
              <PrimaryButton title="Allow notifications" icon="bell" full onPress={onAllow} />
            )}
            <OutlineButton title="Not now" full onPress={onDismiss} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetWrap: { width: '100%' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.black,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    color: colors.gray600,
    lineHeight: 22,
    textAlign: 'center',
  },
  list: { gap: 6, paddingVertical: spacing.sm },
  listItem: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
})
