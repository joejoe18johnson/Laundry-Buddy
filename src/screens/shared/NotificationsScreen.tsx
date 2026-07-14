import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, GhostButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useUserNotifications } from '../../context/NotificationContext'
import { colors, radius, spacing } from '../../theme'

export function NotificationsScreen() {
  const { user } = useAuth()
  const { navigate } = useApp()
  const { notifications, unreadCount, markRead, markAllRead } = useUserNotifications(user?.id)

  if (!user) return null

  const backScreen = user.role === 'customer' ? 'customer-home' : 'host-dashboard'

  return (
    <Screen>
      <BackButton onPress={() => navigate(backScreen)} label="Back" />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppIcon name="bell" size={22} />
          <Text style={styles.title}>Notifications</Text>
        </View>
        {unreadCount > 0 && (
          <GhostButton title="Mark all read" onPress={() => markAllRead(user.id)} />
        )}
      </View>
      <Text style={styles.subtitle}>
        {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
      </Text>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <AppIcon name="bell-off" size={32} color={colors.gray400} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySub}>
            Booking updates and host alerts will show up here.
          </Text>
        </View>
      ) : (
        notifications.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => markRead(item.id)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardTime}>{item.time}</Text>
            </View>
            <Text style={styles.cardBody}>{item.body}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </Pressable>
        ))
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  subtitle: { fontSize: 14, color: colors.gray500, marginBottom: spacing.lg },
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
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    alignSelf: 'flex-start',
  },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySub: { fontSize: 14, color: colors.gray500, textAlign: 'center', lineHeight: 20 },
})
