import { Children, cloneElement, isValidElement, useMemo, type ReactElement, type ReactNode } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon, type IconName } from './AppIcon'
import { useTheme } from '../context/ThemeContext'
import { bottomSafePadding } from '../lib/safeAreaInsets'
import { formatRadiusMilesLabel } from '../lib/locationPreferences'
import { toTitleCase } from '../lib/titleCase'
import { brandColors, radius, spacing } from '../theme'
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
  return {
    styles: StyleSheet.create({
      overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 32, 0.42)',
        alignItems: 'flex-end',
      },
      panelSafe: {
        flex: 1,
        width: '88%',
        maxWidth: 340,
        paddingLeft: spacing.sm,
      },
      panel: {
        flex: 1,
        backgroundColor: colors.white,
        borderTopLeftRadius: radius.sheet,
        borderBottomLeftRadius: radius.sheet,
        overflow: 'hidden',
        shadowColor: brandColors.navy,
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: { width: -4, height: 8 },
        elevation: 12,
      },
      panelInner: { flex: 1, minHeight: 0 },
      headerGradient: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
      },
      headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
      },
      profileIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        alignItems: 'center',
        justifyContent: 'center',
      },
      headerText: { flex: 1, paddingTop: 2 },
      name: { fontSize: 19, fontWeight: '700', color: brandColors.offWhite, letterSpacing: -0.3 },
      rolePill: {
        alignSelf: 'flex-start',
        marginTop: 6,
        backgroundColor: 'rgba(155, 225, 93, 0.22)',
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(155, 225, 93, 0.45)',
      },
      rolePillText: { fontSize: 11, fontWeight: '700', color: brandColors.lime, letterSpacing: 0.4 },
      onlineStatus: {
        fontSize: 12,
        color: 'rgba(253, 253, 253, 0.72)',
        marginTop: 8,
        fontWeight: '600',
      },
      onlineLive: { color: brandColors.lime },
      closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
      },
      menuScroll: { flex: 1, minHeight: 0 },
      menuScrollContent: {
        paddingTop: spacing.md,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.sm,
        flexGrow: 1,
      },
      sectionCard: {
        backgroundColor: colors.gray50,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.gray100,
        overflow: 'hidden',
      },
      sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.gray500,
        letterSpacing: 0.6,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: 4,
        textTransform: 'uppercase',
      },
      menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: 12,
        paddingHorizontal: spacing.md,
      },
      menuItemBorder: {
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
      },
      menuItemPressed: { backgroundColor: colors.gray75 },
      iconBubble: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.gray100,
        alignItems: 'center',
        justifyContent: 'center',
      },
      menuItemBody: { flex: 1, gap: 2 },
      menuLabel: { fontSize: 15, fontWeight: '600', color: colors.black },
      menuHint: { fontSize: 12, color: colors.gray500, fontWeight: '500', lineHeight: 16 },
      badge: {
        backgroundColor: colors.greenBg,
        borderRadius: radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: colors.green,
      },
      badgeText: { fontSize: 10, fontWeight: '700', color: colors.gray600 },
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
        flexShrink: 0,
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: colors.white,
      },
      logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.danger,
        borderRadius: radius.pill,
        paddingVertical: 15,
        shadowColor: colors.danger,
        shadowOpacity: 0.22,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      },
      logoutBtnPressed: { opacity: 0.92 },
      logoutBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
    }),
  }
}

function MenuItem({
  icon,
  label,
  onPress,
  badge,
  badgeVariant = 'active',
  hint,
  styles,
  showDivider,
}: MenuAction & {
  styles: ReturnType<typeof createHeaderMenuStyles>['styles']
  showDivider?: boolean
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        showDivider && styles.menuItemBorder,
        pressed && styles.menuItemPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconBubble}>
        <AppIcon name={icon} size={18} color={colors.black} />
      </View>
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
      <AppIcon name="chevron-right" size={16} color={colors.gray400} />
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
  styles: ReturnType<typeof createHeaderMenuStyles>['styles']
}) {
  const items = Children.toArray(children).filter(Boolean)
  if (items.length === 0) return null

  return (
    <View style={styles.sectionCard}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {items.map((child, index) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<{ showDivider?: boolean }>, {
              showDivider: index > 0,
            })
          : child,
      )}
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
  const insets = useSafeAreaInsets()
  const { styles } = useMemo(() => createHeaderMenuStyles(colors), [colors])
  const footerBottomPad = bottomSafePadding(insets.bottom, spacing.sm)
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
        <SafeAreaView style={styles.panelSafe} edges={['top', 'right']}>
          <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
            <View style={styles.panelInner}>
              <LinearGradient
              colors={[brandColors.navy, '#243240']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <View style={styles.headerRow}>
                <View style={styles.profileIcon}>
                  <AppIcon name="user" size={22} color={brandColors.offWhite} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {user.name}
                  </Text>
                  <View style={styles.rolePill}>
                    <Text style={styles.rolePillText}>{isCustomer ? 'Guest' : 'Host'}</Text>
                  </View>
                  {!isCustomer && (
                    <Text style={[styles.onlineStatus, isHostOnline ? styles.onlineLive : null]}>
                      {isHostOnline ? '● Online now' : '○ Offline'}
                    </Text>
                  )}
                </View>
                <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                  <AppIcon name="x" size={18} color={brandColors.offWhite} />
                </Pressable>
              </View>
            </LinearGradient>

            <ScrollView
              style={styles.menuScroll}
              contentContainerStyle={styles.menuScrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {onOpenLocationSettings ? (
                <MenuSection title="Location" styles={styles}>
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
                  <MenuItem
                    icon="help-circle"
                    label="Help & support"
                    onPress={() => go(onHelp)}
                    styles={styles}
                  />
                ) : null}
                {onTerms ? (
                  <MenuItem
                    icon="file-text"
                    label="Terms and conditions"
                    onPress={() => go(onTerms)}
                    styles={styles}
                  />
                ) : null}
                {onPrivacy ? (
                  <MenuItem
                    icon="shield"
                    label="Privacy policy"
                    onPress={() => go(onPrivacy)}
                    styles={styles}
                  />
                ) : null}
              </MenuSection>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: footerBottomPad }]}>
              <Pressable
                style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
                onPress={() => go(onLogout)}
              >
                <AppIcon name="log-out" size={20} color={colors.white} />
                <Text style={styles.logoutBtnText}>{toTitleCase('Log out')}</Text>
              </Pressable>
            </View>
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  )
}
