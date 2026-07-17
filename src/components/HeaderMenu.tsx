import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon, type IconName } from './AppIcon'
import { bottomSafePadding } from '../lib/safeAreaInsets'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'
import type { User } from '../types'

type MenuAction = {
  icon: IconName
  label: string
  onPress: () => void
  badge?: string
  hint?: string
}

type Props = {
  visible: boolean
  user: User
  onClose: () => void
  onLogout: () => void
  locationLabel?: string
  radiusKm?: number
  onOpenLocationSettings?: () => void
  hasActiveLoad?: boolean
  onExplore?: () => void
  onMyLoad?: () => void
  onPastLoads?: () => void
  onDashboard?: () => void
  onAccount?: () => void
  onHelp?: () => void
  onNotifications?: () => void
  notificationCount?: number
  isHostOnline?: boolean
}

function MenuItem({ icon, label, onPress, badge, hint }: MenuAction) {
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
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <AppIcon name="chevron-right" size={18} color={colors.gray400} />
    </Pressable>
  )
}

function MenuSection({ title, children }: { title?: string; children: ReactNode }) {
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
  radiusKm,
  onOpenLocationSettings,
  hasActiveLoad,
  onExplore,
  onMyLoad,
  onPastLoads,
  onDashboard,
  onAccount,
  onHelp,
  onNotifications,
  notificationCount,
  isHostOnline,
}: Props) {
  const insets = useSafeAreaInsets()
  const isCustomer = user.role === 'customer'
  const contact = user.email ?? user.phone
  const locationHint =
    locationLabel && radiusKm != null ? `${locationLabel} · ${radiusKm} km` : undefined

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
                {contact ? <Text style={styles.contact}>{contact}</Text> : null}
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                <AppIcon name="x" size={20} color={colors.gray500} />
              </Pressable>
            </View>

            <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
              {isCustomer && onOpenLocationSettings ? (
                <MenuSection title="Location Settings">
                  <MenuItem
                    icon="map-pin"
                    label="Search area"
                    hint={locationHint}
                    onPress={() => go(onOpenLocationSettings)}
                  />
                </MenuSection>
              ) : null}

              <MenuSection title={isCustomer ? 'Browse' : 'Hosting'}>
                {isCustomer && onExplore ? (
                  <MenuItem icon="search" label="Explore dryers" onPress={() => go(onExplore)} />
                ) : null}
                {!isCustomer && onDashboard ? (
                  <MenuItem icon="home" label="Dashboard" onPress={() => go(onDashboard)} />
                ) : null}
                {isCustomer && onMyLoad ? (
                  <MenuItem
                    icon="package"
                    label="My load"
                    onPress={() => go(onMyLoad)}
                    badge={hasActiveLoad ? 'Active' : undefined}
                  />
                ) : null}
                {onPastLoads ? (
                  <MenuItem
                    icon="clock"
                    label={isCustomer ? 'Past loads & payments' : 'Load history'}
                    onPress={() => go(onPastLoads)}
                  />
                ) : null}
              </MenuSection>

              <MenuSection title="Account">
                {onAccount ? (
                  <MenuItem icon="user" label="Profile" onPress={() => go(onAccount)} />
                ) : null}
                {onNotifications ? (
                  <MenuItem
                    icon="bell"
                    label="Notifications"
                    onPress={() => go(onNotifications)}
                    badge={notificationCount ? String(notificationCount) : undefined}
                  />
                ) : null}
                {onHelp ? (
                  <MenuItem icon="help-circle" label="Help & support" onPress={() => go(onHelp)} />
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

const styles = StyleSheet.create({
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
  contact: { fontSize: 12, color: colors.gray400, marginTop: spacing.sm },
  closeBtn: { padding: spacing.sm },
  menu: { flex: 1, paddingVertical: spacing.sm },
  section: { paddingBottom: spacing.sm },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray400,
    letterSpacing: 0.6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
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
