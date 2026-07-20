import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { useTheme } from '../context/ThemeContext'
import {
  getPushPermissionStatus,
  openNotificationSettings,
  requestPushPermissions,
  type PushPermissionStatus,
} from '../lib/pushNotifications'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

type Props = {
  compact?: boolean
  onPressBell?: () => void
}

export function NotificationBellReminder({ compact, onPressBell }: Props) {
  const { colors: themeColors } = useTheme()
  const styles = useMemo(() => createStyles(themeColors), [themeColors])
  const [permission, setPermission] = useState<PushPermissionStatus>('undetermined')

  useEffect(() => {
    void getPushPermissionStatus().then(setPermission)
  }, [])

  if (permission === 'granted' || permission === 'unsupported') return null

  const denied = permission === 'denied'

  const handleEnable = async () => {
    if (denied) {
      await openNotificationSettings()
      return
    }
    await requestPushPermissions()
    setPermission(await getPushPermissionStatus())
  }

  return (
    <Pressable
      style={[styles.card, compact && styles.cardCompact]}
      onPress={onPressBell ?? handleEnable}
    >
      <View style={styles.iconWrap}>
        <AppIcon name="bell" size={compact ? 16 : 18} color={themeColors.black} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, compact && styles.titleCompact]}>
          {toTitleCase('Turn on bell notifications')}
        </Text>
        <Text style={[styles.sub, compact && styles.subCompact]}>
          {toTitleCase(
            denied
              ? 'Phone alerts are off — open settings so you never miss when a host accepts, declines, or updates your load.'
              : 'Allow alerts for host responses, ready-for-pickup updates, and drop-off reminders.',
          )}
        </Text>
      </View>
      <Text style={styles.action}>{denied ? toTitleCase('Settings') : toTitleCase('Enable')}</Text>
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
