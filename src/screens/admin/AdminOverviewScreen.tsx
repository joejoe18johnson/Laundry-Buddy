import { useMemo } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { Screen } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import { useAdminDashboardData } from '../../hooks/useAdminDashboardData'
import { useAdminSupportMessages } from '../../hooks/useAdminSupportMessages'
import { toTitleCase } from '../../lib/titleCase'
import { UnreadCountBadge } from '../../components/UnreadCountBadge'
import type { AdminTabId } from '../../components/AdminBottomNav'
import { createAdminStyles } from './adminStyles'

export type AdminUsersFilter = 'all' | 'pending' | 'verified'

export type AdminSectionId = AdminTabId | 'support'

type Props = {
  refreshKey?: number
  onNavigate: (section: AdminSectionId, options?: { usersFilter?: AdminUsersFilter }) => void
}

export function AdminOverviewScreen({ refreshKey, onNavigate }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createAdminStyles(colors), [colors])
  const { loading, queueCount, pendingUsers, verifiedCount, users, codeCounts } =
    useAdminDashboardData(refreshKey)
  const { threads: supportThreads, totalUnread: supportUnreadCount } = useAdminSupportMessages()

  const supportSubtitle =
    supportUnreadCount > 0
      ? `${supportUnreadCount} unread · in-app help from users`
      : supportThreads.length > 0
        ? `${supportThreads.length} conversation${supportThreads.length === 1 ? '' : 's'} · in-app help`
        : 'In-app help from guests and hosts'

  const navItems = [
    {
      tab: 'support' as const,
      icon: 'message-circle' as const,
      title: 'Support messages',
      subtitle: supportSubtitle,
      count: supportUnreadCount,
    },
    {
      tab: 'queue' as const,
      icon: 'inbox' as const,
      title: 'Verification queue',
      subtitle: `${queueCount} open request${queueCount === 1 ? '' : 's'} — codes and ID review`,
      count: queueCount,
    },
    {
      tab: 'users' as const,
      icon: 'users' as const,
      title: 'All users',
      subtitle: `${users.length} accounts · browse and open review`,
      count: 0,
    },
    {
      tab: 'codes' as const,
      icon: 'key' as const,
      title: 'Verification codes',
      subtitle: `${codeCounts.available} available · 6-digit phone codes`,
      count: 0,
    },
  ]

  const statItems = [
    {
      key: 'queue',
      value: loading ? '…' : String(queueCount),
      label: 'Open requests',
      hint: 'Codes and ID review',
      icon: 'inbox' as const,
      section: 'queue' as const,
      highlight: queueCount > 0,
    },
    {
      key: 'pending',
      value: loading ? '…' : String(pendingUsers.length),
      label: 'Pending verify',
      hint: 'Awaiting approval',
      icon: 'clock' as const,
      section: 'users' as const,
      usersFilter: 'pending' as const,
      highlight: pendingUsers.length > 0,
    },
    {
      key: 'verified',
      value: loading ? '…' : String(verifiedCount),
      label: 'Verified',
      hint: 'Approved accounts',
      icon: 'check-circle' as const,
      section: 'users' as const,
      usersFilter: 'verified' as const,
      highlight: false,
    },
    {
      key: 'all',
      value: loading ? '…' : String(users.length),
      label: 'All users',
      hint: 'Browse every account',
      icon: 'users' as const,
      section: 'users' as const,
      usersFilter: 'all' as const,
      highlight: false,
    },
  ]

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {toTitleCase('Tap a summary card to jump straight to that section.')}
        </Text>

        <View style={styles.statsGrid}>
          {statItems.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [
                styles.statCard,
                item.highlight && styles.statCardHighlight,
                pressed && styles.statCardPressed,
              ]}
              onPress={() =>
                onNavigate(
                  item.section,
                  item.usersFilter ? { usersFilter: item.usersFilter } : undefined,
                )
              }
            >
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconWrap, item.highlight && styles.statIconWrapHighlight]}>
                  <AppIcon name={item.icon} size={20} color={item.highlight ? colors.accent : colors.black} />
                </View>
                <AppIcon name="chevron-right" size={18} color={colors.gray400} />
              </View>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{toTitleCase(item.label)}</Text>
              <Text style={styles.statHint}>{toTitleCase(item.hint)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{toTitleCase('Admin sections')}</Text>
        <View style={styles.navGrid}>
          {navItems.map((item) => (
            <Pressable
              key={item.tab}
              style={({ pressed }) => [styles.navCard, pressed && styles.navCardPressed]}
              onPress={() => onNavigate(item.tab)}
            >
              <View style={styles.navIconWrap}>
                <AppIcon name={item.icon} size={20} />
              </View>
              <View style={styles.navCopy}>
                <Text style={styles.navTitle}>{toTitleCase(item.title)}</Text>
                <Text style={styles.navSub}>{toTitleCase(item.subtitle)}</Text>
              </View>
              {item.count > 0 ? (
                <UnreadCountBadge count={item.count} size="md" />
              ) : (
                <AppIcon name="chevron-right" size={18} color={colors.gray400} />
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  )
}
