import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './src/components/AppIcon'
import { AppProvider, useApp } from './src/context/AppContext'
import { AuthProvider, needsHostVerification, useAuth } from './src/context/AuthContext'
import { NotificationProvider, useUserNotifications } from './src/context/NotificationContext'
import { HomeScreen } from './src/screens/customer/HomeScreen'
import { BookingScreen } from './src/screens/customer/BookingScreen'
import { HostProfileScreen } from './src/screens/customer/HostProfileScreen'
import { TrackingScreen } from './src/screens/customer/TrackingScreen'
import { DashboardScreen } from './src/screens/host/DashboardScreen'
import { HostHubScreen } from './src/screens/host/HostHubScreen'
import { MarkDryScreen } from './src/screens/host/MarkDryScreen'
import { WelcomeScreen } from './src/screens/auth/WelcomeScreen'
import { LoginScreen } from './src/screens/auth/LoginScreen'
import { SignupScreen } from './src/screens/auth/SignupScreen'
import { HeaderMenu } from './src/components/HeaderMenu'
import { HostVerificationScreen } from './src/screens/auth/HostVerificationScreen'
import { HistoryScreen } from './src/screens/shared/HistoryScreen'
import { AccountScreen } from './src/screens/shared/AccountScreen'
import { HelpScreen } from './src/screens/shared/HelpScreen'
import { NotificationsScreen } from './src/screens/shared/NotificationsScreen'
import { colors, spacing } from './src/theme'

SplashScreen.preventAutoHideAsync().catch(() => {})

function AppShell() {
  const { user, logout } = useAuth()
  const { screen, booking, navigate, hostSettings } = useApp()
  const { unreadCount } = useUserNotifications(user!.id)
  const [menuOpen, setMenuOpen] = useState(false)

  const isCustomer = user!.role === 'customer'
  const firstName = user!.name.split(' ')[0]
  const isHome = screen === 'customer-home'
  const hideTabBarScreens = new Set([
    'customer-tracking',
    'customer-host-profile',
    'history',
    'account',
    'help',
    'notifications',
  ])
  const showTabBar = isCustomer && booking && !hideTabBarScreens.has(screen)
  const exploreActive =
    screen === 'customer-home' || screen === 'customer-booking' || screen === 'customer-host-profile'

  return (
    <SafeAreaView style={styles.app} edges={['top']}>
      <StatusBar style="dark" />
      <View style={[styles.header, isHome && styles.headerHome]}>
        <Text style={styles.greetingLarge}>Hi {firstName}</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => navigate('notifications')} style={styles.bellBtn} hitSlop={8}>
            <AppIcon name="bell" size={22} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => navigate('account')} style={styles.avatar} hitSlop={4}>
            <AppIcon name="user" size={18} color={colors.gray600} />
          </Pressable>
          <Pressable onPress={() => setMenuOpen(true)} style={styles.menuBtn} hitSlop={8}>
            <AppIcon name="menu" size={22} />
          </Pressable>
        </View>
      </View>

      <HeaderMenu
        visible={menuOpen}
        user={user!}
        onClose={() => setMenuOpen(false)}
        hasActiveLoad={!!booking}
        isHostOnline={hostSettings?.isOnline}
        notificationCount={unreadCount}
        onExplore={isCustomer ? () => navigate('customer-home') : undefined}
        onMyLoad={isCustomer ? () => navigate('customer-tracking') : undefined}
        onPastLoads={() => navigate('history')}
        onDashboard={!isCustomer ? () => navigate('host-dashboard') : undefined}
        onAccount={() => navigate('account')}
        onHelp={() => navigate('help')}
        onNotifications={() => navigate('notifications')}
        onLogout={logout}
      />

      <View style={[styles.main, showTabBar && styles.mainWithTab]}>
        {screen === 'customer-home' && <HomeScreen />}
        {screen === 'customer-host-profile' && <HostProfileScreen />}
        {screen === 'customer-booking' && <BookingScreen />}
        {screen === 'customer-tracking' && <TrackingScreen />}
        {screen === 'host-dashboard' && <DashboardScreen />}
        {screen === 'host-mark-dry' && <MarkDryScreen />}
        {screen === 'history' && <HistoryScreen />}
        {screen === 'account' && (isCustomer ? <AccountScreen /> : <HostHubScreen />)}
        {screen === 'help' && <HelpScreen />}
        {screen === 'notifications' && <NotificationsScreen />}
      </View>

      {showTabBar && (
        <SafeAreaView edges={['bottom']} style={styles.tabBar}>
          <Pressable style={styles.tab} onPress={() => navigate('customer-home')}>
            <AppIcon
              name="home"
              size={20}
              color={exploreActive ? colors.black : colors.gray500}
            />
            <Text style={[styles.tabText, exploreActive && styles.tabTextActive]}>Home</Text>
          </Pressable>
          <Pressable style={styles.tab} onPress={() => navigate('customer-tracking')}>
            <AppIcon name="package" size={20} color={colors.gray500} />
            <Text style={styles.tabText}>My load</Text>
          </Pressable>
        </SafeAreaView>
      )}
    </SafeAreaView>
  )
}

function AuthenticatedApp() {
  const { user, authScreen } = useAuth()

  if (!user) {
    return (
      <SafeAreaView style={styles.app} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        {authScreen === 'welcome' && <WelcomeScreen />}
        {authScreen === 'login' && <LoginScreen />}
        {authScreen === 'signup' && <SignupScreen />}
      </SafeAreaView>
    )
  }

  if (needsHostVerification(user)) {
    return (
      <SafeAreaView style={styles.app} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <HostVerificationScreen />
      </SafeAreaView>
    )
  }

  return (
    <NotificationProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </NotificationProvider>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  headerHome: {
    borderBottomWidth: 0,
    paddingBottom: 8,
  },
  greetingLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.black,
    letterSpacing: -0.4,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { fontSize: 9, fontWeight: '700', color: colors.white },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: { flex: 1 },
  mainWithTab: { marginBottom: 0 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    backgroundColor: colors.white,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', gap: 4 },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.gray500 },
  tabTextActive: { color: colors.black },
})
