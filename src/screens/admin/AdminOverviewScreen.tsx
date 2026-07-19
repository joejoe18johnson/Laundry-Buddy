import { useMemo } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { Screen } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import { useAdminDashboardData } from '../../hooks/useAdminDashboardData'
import { toTitleCase } from '../../lib/titleCase'
import { UnreadCountBadge } from '../../components/UnreadCountBadge'
import type { AdminTabId } from '../../components/AdminBottomNav'
import { createAdminStyles } from './adminStyles'

type Props = {
  refreshKey?: number
  onNavigate: (tab: AdminTabId) => void
}

export function AdminOverviewScreen({ refreshKey, onNavigate }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createAdminStyles(colors), [colors])
  const { loading, queueCount, pendingUsers, verifiedCount, users, codeCounts } =
    useAdminDashboardData(refreshKey)

  const navItems = [
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
      subtitle: `${codeCounts.available} available · 6-digit WhatsApp codes`,
      count: 0,
    },
  ]

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {toTitleCase('Support overview — jump into the section you need.')}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{loading ? '…' : queueCount}</Text>
            <Text style={styles.statLabel}>Open requests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{loading ? '…' : pendingUsers.length}</Text>
            <Text style={styles.statLabel}>Pending verify</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{loading ? '…' : verifiedCount}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{loading ? '…' : users.length}</Text>
            <Text style={styles.statLabel}>All users</Text>
          </View>
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
