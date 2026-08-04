import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon, type IconName } from './AppIcon'
import { UnreadCountBadge } from './UnreadCountBadge'
import { useTheme } from '../context/ThemeContext'
import { toTitleCase } from '../lib/titleCase'

export type AdminTabId = 'overview' | 'queue' | 'users' | 'codes' | 'support'

export type AdminNavTab = {
  id: AdminTabId
  label: string
  icon: IconName
  badgeCount?: number
}

type Props = {
  tabs: AdminNavTab[]
  currentTab: AdminTabId
  onNavigate: (tab: AdminTabId) => void
}

export function AdminBottomNav({ tabs, currentTab, onNavigate }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          flexDirection: 'row',
          borderTopWidth: 1,
          borderTopColor: colors.gray100,
          backgroundColor: colors.white,
          paddingTop: 6,
          paddingBottom: 4,
          overflow: 'visible',
        },
        tab: { flex: 1, alignItems: 'center', paddingVertical: 8, gap: 4, overflow: 'visible' },
        iconWrap: {
          position: 'relative',
          width: 28,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        },
        badgeAnchor: {
          position: 'absolute',
          top: -4,
          right: -8,
          zIndex: 2,
        },
        label: { fontSize: 10, fontWeight: '600', color: colors.gray400, textAlign: 'center' },
        labelActive: { color: colors.black, fontWeight: '700' },
      }),
    [colors],
  )

  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const active = tab.id === currentTab
        const count = tab.badgeCount ?? 0
        const showBadge = count > 0

        return (
          <Pressable
            key={tab.id}
            style={styles.tab}
            onPress={() => onNavigate(tab.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={
              showBadge ? `${toTitleCase(tab.label)}, ${count} unread` : toTitleCase(tab.label)
            }
          >
            <View style={styles.iconWrap}>
              <AppIcon name={tab.icon} size={20} color={active ? colors.black : colors.gray400} />
              {showBadge ? (
                <View style={styles.badgeAnchor}>
                  <UnreadCountBadge count={count} size="md" />
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {toTitleCase(tab.label)}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
