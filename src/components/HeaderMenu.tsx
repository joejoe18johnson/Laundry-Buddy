import { useMemo, type ReactNode } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon, type IconName } from './AppIcon'
import { useTheme } from '../context/ThemeContext'
import { bottomSafePadding } from '../lib/safeAreaInsets'
import { formatRadiusMilesLabel } from '../lib/locationPreferences'
import { toTitleCase } from '../lib/titleCase'
import { radius, spacing } from '../theme'
import type { User } from '../types'

type MenuAction = {
  icon: IconName
  label: string
  onPress: () => void
  badge?: string
  badgeVariant?: 'active' | 'alert'
  hint?: string
}

type Props = {
  visible: boolean
  user: User
  onClose: () => void
  onLogout: () => void
  locationLabel?: string
  radiusMiles?: number
  onOpenLocationSettings?: () => void
  hasActiveLoad?: boolean
  onExplore?: () => void
  onMyLoad?: () => void
  onPastLoads?: () => void
  onAccount?: () => void
  onHelp?: () => void
  onTerms?: () => void
  onPrivacy?: () => void
  onContactSupport?: () => void
  onNotifications?: () => void
  notificationCount?: number
  isHostOnline?: boolean
}

function createHeaderMenuStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      alignItems: 'flex-end',
    },
    panel: {
      width: '88%',
      maxWidth: 360,
      height: '100%',
      backgroundColor: colors.white,
      borderLeftWidth: 1,
      borderLeftColor: colors.gray100,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
    panelInner: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray100,
    },
    profileIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.gray100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: { flex: 1 },
    name: { fontSize: 18, fontWeight: '700', color: colors.black },
    role: { fontSize: 13, color: colors.gray500, marginTop: 2 },
    onlineStatus: { fontSize: 12, color: colors.gray400, marginTop: 4, fontWeight: '600' },
    onlineLive: { color: colors.green },
    closeBtn: { padding: spacing.sm },
    menu: { flex: 1, paddingVertical: 8 },
    section: { paddingBottom: 8 },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.gray400,
      letterSpacing: 0.6,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: 6,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 13,
      paddingHorizontal: spacing.lg,
    },
    menuItemPressed: { backgroundColor: colors.gray50 },
    menuItemBody: { flex: 1, gap: 2 },
    menuLabel: { fontSize: 16, fontWeight: '600', color: colors.black },
    menuHint: { fontSize: 13, color: colors.gray500, fontWeight: '500' },
    badge: {
      backgroundColor: colors.greenBg,
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: colors.green,
    },
    badgeText: { fontSize: 10, fontWeight: '700', color: colors.green },
    alertBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    alertBadgeText: { fontSize: 11, fontWeight: '700', color: colors.white },
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.gray100,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.danger,
      borderRadius: radius.lg,
      paddingVertical: 16,
      shadowColor: colors.danger,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    logoutBtnPressed: { opacity: 0.92 },
    logoutBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  })
}

function MenuItem({
  icon,
  label,
  onPress,
  badge,
  badgeVariant = 'active',
  hint,
  styles,
}: MenuAction & { styles: ReturnType<typeof createHeaderMenuStyles> }) {
  const { colors } = useTheme()
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
    >
      <AppIcon name={icon} size={20} />
      <View style={styles.menuItemBody}>
        <Text style={styles.menuLabel}>{toTitleCase(label)}</Text>
        {hint ? <Text style={styles.menuHint}>{hint}</Text> : null}
      </View>
      {badge ? (
        badgeVariant === 'alert' ? (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{badge}</Text>
          </View>
        ) : (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )
      ) : null}
      <AppIcon name="chevron-right" size={18} color={colors.gray400} />
    </Pressable>
  )
}

function MenuSection({
  title,
  children,
  styles,
}: {
  title?: string
  children: ReactNode
  styles: ReturnType<typeof createHeaderMenuStyles>
}) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{toTitleCase(title)}</Text> : null}
      {children}
    </View>
  )
}

export function HeaderMenu({
  visible,
  user,
  onClose,
  onLogout,
  locationLabel,
  radiusMiles,
  onOpenLocationSettings,
  hasActiveLoad,
  onExplore,
  onMyLoad,
  onPastLoads,
  onAccount,
  onHelp,
  onTerms,
  onPrivacy,
  onContactSupport,
  onNotifications,
  notificationCount,
  isHostOnline,
}: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createHeaderMenuStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const isCustomer = user.role === 'customer'
  const locationHint =
    locationLabel && radiusMiles != null
      ? `${locationLabel} · ${formatRadiusMilesLabel(radiusMiles)}`
      : undefined

  const go = (action?: () => void) => {
    onClose()
    action?.()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={['top', 'right', 'bottom']} style={styles.panelInner}>
            <View style={styles.header}>
              <View style={styles.profileIcon}>
                <AppIcon name="user" size={20} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.role}>{isCustomer ? 'Guest' : 'Host'}</Text>
                {!isCustomer && (
                  <Text style={[styles.onlineStatus, isHostOnline ? styles.onlineLive : null]}>
                    {isHostOnline ? '● Online' : '○ Offline'}
                  </Text>
                )}
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                <AppIcon name="x" size={20} color={colors.gray500} />
              </Pressable>
            </View>

            <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
              {onOpenLocationSettings ? (
                <MenuSection title="Location Settings" styles={styles}>
                  <MenuItem
                    icon="map-pin"
                    label={isCustomer ? 'Search area' : 'Browse area'}
                    hint={locationHint}
                    onPress={() => go(onOpenLocationSettings)}
                    styles={styles}
                  />
                </MenuSection>
              ) : null}

              {isCustomer ? (
                <MenuSection title="Browse" styles={styles}>
                  {onExplore ? (
                    <MenuItem
                      icon="search"
                      label="Explore dryers"
                      onPress={() => go(onExplore)}
                      styles={styles}
                    />
                  ) : null}
                  {onMyLoad ? (
                    <MenuItem
                      icon="package"
                      label="My loads"
                      onPress={() => go(onMyLoad)}
                      badge={hasActiveLoad ? 'Active' : undefined}
                      styles={styles}
                    />
                  ) : null}
                  {onPastLoads ? (
                    <MenuItem
                      icon="clock"
                      label="Past loads & payments"
                      onPress={() => go(onPastLoads)}
                      styles={styles}
                    />
                  ) : null}
                </MenuSection>
              ) : null}

              <MenuSection title="Account" styles={styles}>
                {onAccount ? (
                  <MenuItem icon="user" label="Profile" onPress={() => go(onAccount)} styles={styles} />
                ) : null}
                {onNotifications ? (
                  <MenuItem
                    icon="bell"
                    label="Notifications"
                    onPress={() => go(onNotifications)}
                    badge={notificationCount ? String(notificationCount) : undefined}
                    badgeVariant="alert"
                    styles={styles}
                  />
                ) : null}
                {onContactSupport ? (
                  <MenuItem
                    icon="message-circle"
                    label="Contact support"
                    onPress={() => go(onContactSupport)}
                    styles={styles}
                  />
                ) : null}
                {onHelp ? (
                  <MenuItem icon="help-circle" label="Help & support" onPress={() => go(onHelp)} styles={styles} />
                ) : null}
                {onTerms ? (
                  <MenuItem icon="file-text" label="Terms and conditions" onPress={() => go(onTerms)} styles={styles} />
                ) : null}
                {onPrivacy ? (
                  <MenuItem icon="shield" label="Privacy policy" onPress={() => go(onPrivacy)} styles={styles} />
                ) : null}
              </MenuSection>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: bottomSafePadding(insets.bottom, spacing.sm) }]}>
              <Pressable
                style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
                onPress={() => go(onLogout)}
              >
                <AppIcon name="log-out" size={20} color={colors.white} />
                <Text style={styles.logoutBtnText}>{toTitleCase('Log out')}</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
