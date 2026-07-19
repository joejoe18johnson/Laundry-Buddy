import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, Screen } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useNotifications, useUserNotifications } from '../../context/NotificationContext'
import { useTheme } from '../../context/ThemeContext'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'
import type { AppNotification } from '../../types'

type AdminNotificationsScreenProps = {
  onBack: () => void
  onOpenRequest: (userId?: string) => void
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    title: { fontSize: 24, fontWeight: '700', color: colors.black, marginBottom: spacing.md },
    row: {
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: colors.white,
      gap: 4,
    },
    rowUnread: { borderColor: colors.black, backgroundColor: colors.gray50 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: colors.black },
    rowBody: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
    rowTime: { fontSize: 12, color: colors.gray400 },
    empty: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
    emptyText: { fontSize: 14, color: colors.gray500 },
  })
}

export function AdminNotificationsScreen({ onBack, onOpenRequest }: AdminNotificationsScreenProps) {
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { notifications: allNotifications } = useNotifications()
  const { markRead } = useUserNotifications(user?.id)
  const [items, setItems] = useState<AppNotification[]>([])

  useEffect(() => {
    if (!user) return
    setItems(allNotifications.filter((entry) => entry.userId === user.id))
  }, [allNotifications, user])

  const openItem = async (item: AppNotification) => {
    await markRead(item.id)
    onOpenRequest(item.link?.screen === 'admin-dashboard' ? item.link.userId : undefined)
  }

  return (
    <Screen>
      <BackButton onPress={onBack} />
      <Text style={styles.title}>{toTitleCase('Notifications')}</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <AppIcon name="bell" size={28} color={colors.gray400} />
            <Text style={styles.emptyText}>{toTitleCase('No notifications yet')}</Text>
          </View>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.row, !item.read && styles.rowUnread]}
              onPress={() => void openItem(item)}
            >
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowBody}>{item.body}</Text>
              <Text style={styles.rowTime}>{item.time}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  )
}
