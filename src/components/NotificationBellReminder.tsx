import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { registerPushTokenForUser } from '../lib/supabase/notificationService'
import {
  getPushPermissionStatus,
  isPushPermissionBlockedInSettings,
  openNotificationSettings,
  promptForPushNotifications,
  type PushPermissionStatus,
} from '../lib/pushNotifications'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

type Props = {
  compact?: boolean
}

export function NotificationBellReminder({ compact }: Props) {
  const { user } = useAuth()
  const { colors: themeColors } = useTheme()
  const styles = useMemo(() => createStyles(themeColors), [themeColors])
  const [permission, setPermission] = useState<PushPermissionStatus>('undetermined')
  const [blockedInSettings, setBlockedInSettings] = useState(false)

  const refreshPermission = useCallback(async () => {
    setPermission(await getPushPermissionStatus())
    setBlockedInSettings(await isPushPermissionBlockedInSettings())
  }, [])

  useEffect(() => {
    void refreshPermission()
  }, [refreshPermission])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshPermission()
      }
    })
    return () => subscription.remove()
  }, [refreshPermission])

  if (permission === 'granted' || permission === 'unsupported') return null

  const handleEnable = async () => {
    if (blockedInSettings) {
      await openNotificationSettings()
      return
    }

    const status = await promptForPushNotifications()
    setPermission(status)
    setBlockedInSettings(await isPushPermissionBlockedInSettings())
    if (status === 'granted' && user) {
      await registerPushTokenForUser(user)
    }
  }

  return (
    <Pressable style={[styles.card, compact && styles.cardCompact]} onPress={handleEnable}>
      <View style={styles.iconWrap}>
        <AppIcon name="bell" size={compact ? 16 : 18} color={themeColors.black} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, compact && styles.titleCompact]}>
          {toTitleCase('Turn on notifications')}
        </Text>
        <Text style={[styles.sub, compact && styles.subCompact]}>
          {toTitleCase(
            blockedInSettings
              ? 'Notifications are blocked in phone settings. Tap to open settings.'
              : 'Tap Allow — one tap on the next screen for booking, verification, and messages.',
          )}
        </Text>
      </View>
      <Text style={styles.action}>
        {blockedInSettings ? toTitleCase('Settings') : toTitleCase('Allow')}
      </Text>
    </Pressable>
  )
}

function createStyles(themeColors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 1,
      borderColor: themeColors.black,
      borderRadius: radius.lg,
      backgroundColor: themeColors.gray50,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    cardCompact: {
      marginBottom: spacing.md,
      paddingVertical: spacing.sm,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: themeColors.gray200,
    },
    body: { flex: 1, gap: 4 },
    title: { fontSize: 15, fontWeight: '700', color: themeColors.black },
    titleCompact: { fontSize: 14 },
    sub: { fontSize: 13, color: themeColors.gray600, lineHeight: 18 },
    subCompact: { fontSize: 12, lineHeight: 16 },
    action: { fontSize: 13, fontWeight: '700', color: themeColors.black },
  })
}
