import { Modal, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import { PrimaryButton, OutlineButton } from './ui'
import { toTitleCase } from '../lib/titleCase'
import type { PushPermissionStatus } from '../lib/pushNotifications'
import { colors, radius, spacing } from '../theme'

type Props = {
  visible: boolean
  permission: PushPermissionStatus
  onEnable: () => void
  onDismiss: () => void
}

export function NotificationPermissionPrompt({ visible, permission, onEnable, onDismiss }: Props) {
  const denied = permission === 'denied'

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheetWrap} edges={['bottom']}>
          <View style={styles.sheet}>
            <View style={styles.iconWrap}>
              <AppIcon name="bell" size={28} color={colors.white} />
            </View>
            <Text style={styles.title}>{toTitleCase('Stay on time with alerts')}</Text>
            <Text style={styles.body}>
              {toTitleCase(
                denied
                  ? 'Notifications are off on this phone. Turn them on so you never miss when a load is accepted, drying, or ready for pickup.'
                  : 'Laundry Buddy works best with alerts on. Allow notifications for host responses, ready-for-pickup updates, and drop-off reminders.',
              )}
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• {toTitleCase('Host accepts or declines your request')}</Text>
              <Text style={styles.listItem}>• {toTitleCase('Load is drying or ready for pickup')}</Text>
              <Text style={styles.listItem}>• {toTitleCase('Reminders before drop-off time')}</Text>
            </View>
            <PrimaryButton
              title={denied ? 'Open phone settings' : 'Turn on notifications'}
              icon="bell"
              full
              onPress={onEnable}
            />
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
