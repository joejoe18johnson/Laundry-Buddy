import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, OutlineButton, PrimaryButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useUserNotifications } from '../../context/NotificationContext'
import { getNotificationScreen } from '../../lib/notificationRoutes'
import {
  getPushPermissionStatus,
  requestPushPermissions,
  type PushPermissionStatus,
} from '../../lib/pushNotifications'
import { colors, radius, spacing } from '../../theme'
import type { AppNotification } from '../../types'

function groupNotifications(items: AppNotification[]) {
  const today: AppNotification[] = []
  const earlier: AppNotification[] = []
  for (const item of items) {
    if (item.time.includes('AM') || item.time.includes('PM')) {
      today.push(item)
    } else {
      earlier.push(item)
    }
  }
  if (today.length === 0 && earlier.length === 0 && items.length > 0) {
    return [{ title: 'Recent', data: items }]
  }
  const sections: { title: string; data: AppNotification[] }[] = []
  if (today.length) sections.push({ title: 'Today', data: today })
  if (earlier.length) sections.push({ title: 'Earlier', data: earlier })
  if (!sections.length && items.length) sections.push({ title: 'Recent', data: items })
  return sections
}

export function NotificationsScreen() {
  const { user } = useAuth()
  const { navigate } = useApp()
  const { notifications, unreadCount, markRead, markAllRead } = useUserNotifications(user?.id)
  const [permission, setPermission] = useState<PushPermissionStatus>('undetermined')

  useEffect(() => {
    getPushPermissionStatus().then(setPermission)
  }, [])

  if (!user) return null

  const backScreen = user.role === 'customer' ? 'customer-home' : 'host-dashboard'
  const sections = groupNotifications(notifications)

  const openNotification = (item: AppNotification) => {
    markRead(item.id)
    const target = getNotificationScreen(item.title, user.role)
    if (target) navigate(target)
  }

  return (
    <Screen>
      <BackButton onPress={() => navigate(backScreen)} label="Back" />
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <AppIcon name="bell" size={22} />
            <Text style={styles.title}>Notifications</Text>
          </View>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} unread · tap to open` : 'You are all caught up'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <Pressable
            onPress={() => markAllRead(user.id)}
            hitSlop={8}
            style={({ pressed }) => [styles.markAllBtn, pressed && styles.markAllBtnPressed]}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {permission !== 'granted' && permission !== 'unsupported' && (
        <View style={styles.permissionCard}>
          <AppIcon name="bell" size={18} color={colors.black} />
          <View style={styles.permissionBody}>
            <Text style={styles.permissionTitle}>Phone alerts are off</Text>
            <Text style={styles.permissionSub}>
              Enable notifications for host responses, ready-for-pickup alerts, and drop-off reminders.
            </Text>
          </View>
          <OutlineButton
            title="Enable"
            onPress={async () => {
              const granted = await requestPushPermissions()
              setPermission(granted ? 'granted' : 'denied')
            }}
          />
        </View>
      )}

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <AppIcon name="bell-off" size={32} color={colors.gray400} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySub}>
            Booking updates and host alerts will show up here.
          </Text>
          {user.role === 'customer' ? (
            <PrimaryButton title="Explore dryers" icon="search" onPress={() => navigate('customer-home')} />
          ) : (
            <PrimaryButton title="Go to dashboard" icon="home" onPress={() => navigate('host-dashboard')} />
          )}
        </View>
      ) : (
        sections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            {section.data.map((item) => {
              const target = getNotificationScreen(item.title, user.role)
              return (
                <Pressable
                  key={item.id}
                  style={[styles.card, !item.read && styles.cardUnread]}
                  onPress={() => openNotification(item)}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.cardBody}>{item.body}</Text>
                  <View style={styles.cardFooter}>
                    {!item.read && <View style={styles.unreadDot} />}
                    {target && (
                      <View style={styles.openHint}>
                        <Text style={styles.openHintText}>Open</Text>
                        <AppIcon name="chevron-right" size={14} color={colors.gray500} />
                      </View>
                    )}
                  </View>
                </Pressable>
              )
            })}
          </View>
        ))
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  titleBlock: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  subtitle: { fontSize: 14, color: colors.gray500, lineHeight: 20 },
  markAllBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginTop: 2,
  },
  markAllBtnPressed: { opacity: 0.7 },
  markAllText: { fontSize: 14, fontWeight: '600', color: colors.black },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.gray50,
  },
  permissionBody: { flex: 1, gap: 4 },
  permissionTitle: { fontSize: 15, fontWeight: '700', color: colors.black },
  permissionSub: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray500,
    textTransform: 'capitalize',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardUnread: { borderColor: colors.black, backgroundColor: colors.gray50 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  cardTime: { fontSize: 12, color: colors.gray400 },
  cardBody: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  openHint: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 'auto' },
  openHintText: { fontSize: 12, fontWeight: '600', color: colors.gray500 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySub: { fontSize: 14, color: colors.gray500, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
})
