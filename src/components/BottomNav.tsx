import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon, type IconName } from './AppIcon'
import { useTheme } from '../context/ThemeContext'
import { toTitleCase } from '../lib/titleCase'
import type { Screen } from '../types'

export type NavTab = {
  id: string
  label: string
  icon: IconName
  screen: Screen
  matchScreens: Screen[]
  badge?: boolean
  badgeCount?: number
}

type Props = {
  tabs: NavTab[]
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
}

export function BottomNav({ tabs, currentScreen, onNavigate }: Props) {
  const { colors } = useTheme()
  const styles = StyleSheet.create({
    bar: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.gray100,
      backgroundColor: colors.white,
      paddingTop: 6,
      paddingBottom: 4,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 8, gap: 4 },
    iconWrap: { position: 'relative' },
    dot: {
      position: 'absolute',
      top: -2,
      right: -4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.black,
      borderWidth: 1.5,
      borderColor: colors.white,
    },
    countBadge: {
      position: 'absolute',
      top: -6,
      right: -10,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: colors.black,
      borderWidth: 1.5,
      borderColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countBadgeText: { fontSize: 10, fontWeight: '700', color: colors.white },
    label: { fontSize: 11, fontWeight: '600', color: colors.gray400 },
    labelActive: { color: colors.black, fontWeight: '700' },
  })

  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const active = tab.matchScreens.includes(currentScreen)
        const showCount = !active && (tab.badgeCount ?? 0) > 0
        const showDot = !active && !showCount && tab.badge

        return (
          <Pressable
            key={tab.id}
            style={styles.tab}
            onPress={() => onNavigate(tab.screen)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={
              showCount ? `${tab.label}, ${tab.badgeCount} new messages` : tab.label
            }
          >
            <View style={styles.iconWrap}>
              <AppIcon name={tab.icon} size={22} color={active ? colors.black : colors.gray400} />
              {showCount ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {(tab.badgeCount ?? 0) > 9 ? '9+' : tab.badgeCount}
                  </Text>
                </View>
              ) : showDot ? (
                <View style={styles.dot} />
              ) : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{toTitleCase(tab.label)}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
