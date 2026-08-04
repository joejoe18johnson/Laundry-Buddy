import { Modal, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import { PrimaryButton, OutlineButton } from './ui'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

type Props = {
  visible: boolean
  onOpenSettings: () => void
  onDismiss: () => void
}

/** Shown only when the OS will no longer display the native Allow dialog. */
export function NotificationPermissionPrompt({ visible, onOpenSettings, onDismiss }: Props) {
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
            <Text style={styles.title}>{toTitleCase('Notifications are turned off')}</Text>
            <Text style={styles.body}>
              {toTitleCase(
                'Laundry Buddy needs phone alerts for booking updates, verification results, and messages. Open your phone settings and turn notifications on for Laundry Buddy.',
              )}
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• {toTitleCase('Host accepts, declines, or updates your load')}</Text>
              <Text style={styles.listItem}>• {toTitleCase('Verification approved or needs resubmit')}</Text>
              <Text style={styles.listItem}>• {toTitleCase('New messages from your host or guest')}</Text>
            </View>
            <PrimaryButton title="Open phone settings" icon="settings" full onPress={onOpenSettings} />
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
