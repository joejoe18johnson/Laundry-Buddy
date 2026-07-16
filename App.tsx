import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useMemo, useState, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './src/components/AppIcon'
import { BiometricSetupPrompt } from './src/components/BiometricSetupPrompt'
import { BottomNav, type NavTab } from './src/components/BottomNav'
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
import { IntroOnboardingScreen } from './src/screens/auth/IntroOnboardingScreen'
import { LoginScreen } from './src/screens/auth/LoginScreen'
import { SignupScreen } from './src/screens/auth/SignupScreen'
import { HeaderMenu } from './src/components/HeaderMenu'
import { HostVerificationScreen } from './src/screens/auth/HostVerificationScreen'
import { HistoryScreen } from './src/screens/shared/HistoryScreen'
import { AccountScreen } from './src/screens/shared/AccountScreen'
import { HelpScreen } from './src/screens/shared/HelpScreen'
import { NotificationsScreen } from './src/screens/shared/NotificationsScreen'
import { colors, spacing } from './src/theme'
import { hasSeenIntro, markIntroSeen } from './src/lib/introStorage'
import { isFullFlowTesting, TESTING_SPLASH_MS } from './src/lib/testingFlow'
import { SplashLoading } from './src/components/SplashLoading'
import { NotificationPermissionPrompt } from './src/components/NotificationPermissionPrompt'
import { ToastProvider } from './src/context/ToastContext'
import { getNotificationScreen } from './src/lib/notificationRoutes'
import {
  addNotificationResponseListener,
  markPermissionPrompted,
  requestPushPermissions,
  shouldShowPermissionPrompt,
} from './src/lib/pushNotifications'
import type { Screen } from './src/types'

SplashScreen.preventAutoHideAsync().catch(() => {})

const HIDE_BOTTOM_NAV: Screen[] = [
  'customer-booking',
  'customer-host-profile',
  'host-mark-dry',
  'notifications',
  'help',
]

function AppShell() {
  const { user, logout } = useAuth()
  const {
    screen,
    booking,
    navigate,
    hostSettings,
  } = useApp()
  const { unreadCount } = useUserNotifications(user!.id)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showNotifPrompt, setShowNotifPrompt] = useState(false)

  const isCustomer = user!.role === 'customer'
  const firstName = user!.name.split(' ')[0]
  const isHome = screen === 'customer-home'

  const loadNeedsAttention =
    booking &&
    (booking.requestStatus === 'pending' ||
      (booking.requestStatus !== 'declined' && booking.stage !== 'ready'))

  const customerTabs: NavTab[] = useMemo(
    () => [
      {
        id: 'home',
        label: 'Home',
        icon: 'home',
        screen: 'customer-home',
        matchScreens: ['customer-home'],
      },
      {
        id: 'load',
        label: 'My load',
        icon: 'package',
        screen: 'customer-tracking',
        matchScreens: ['customer-tracking'],
        badge: !!loadNeedsAttention,
      },
      {
        id: 'history',
        label: 'History',
        icon: 'clock',
        screen: 'history',
        matchScreens: ['history'],
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: 'user',
        screen: 'account',
        matchScreens: ['account'],
      },
    ],
    [loadNeedsAttention],
  )

  const hostTabs: NavTab[] = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'home',
        screen: 'host-dashboard',
        matchScreens: ['host-dashboard'],
      },
      {
        id: 'history',
        label: 'History',
        icon: 'clock',
        screen: 'history',
        matchScreens: ['history'],
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: 'user',
        screen: 'account',
        matchScreens: ['account'],
      },
    ],
    [],
  )

  const tabs = isCustomer ? customerTabs : hostTabs
  const showBottomNav = !HIDE_BOTTOM_NAV.includes(screen)

  useEffect(() => {
    shouldShowPermissionPrompt().then(setShowNotifPrompt)
  }, [])

  useEffect(() => {
    const subscription = addNotificationResponseListener((title) => {
      const target = getNotificationScreen(title, user!.role)
      navigate(target ?? 'notifications')
    })
    return () => subscription.remove()
  }, [navigate, user])

  const enableNotifications = async () => {
    await requestPushPermissions()
    setShowNotifPrompt(false)
  }

  const dismissNotifications = async () => {
    await markPermissionPrompted()
    setShowNotifPrompt(false)
  }

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

      <View style={styles.main}>
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

      {showBottomNav && (
        <SafeAreaView edges={['bottom']} style={styles.bottomNavWrap}>
          <BottomNav tabs={tabs} currentScreen={screen} onNavigate={navigate} />
        </SafeAreaView>
      )}

      <NotificationPermissionPrompt
        visible={showNotifPrompt}
        onEnable={enableNotifications}
        onDismiss={dismissNotifications}
      />
    </SafeAreaView>
  )
}

function BiometricOverlays() {
  const {
    user,
    showBiometricSetupPrompt,
    biometricSupport,
    biometricSetupLoading,
    acceptBiometricSetup,
    dismissBiometricSetup,
  } = useAuth()

  if (!user) return null

  return (
    <BiometricSetupPrompt
      visible={showBiometricSetupPrompt}
      support={biometricSupport}
      loading={biometricSetupLoading}
      onEnable={() => void acceptBiometricSetup()}
      onSkip={dismissBiometricSetup}
    />
  )
}

function AuthenticatedApp() {
  const { user, authScreen, ready } = useAuth()
  const [introSeen, setIntroSeen] = useState<boolean | null>(null)
  const [splashDone, setSplashDone] = useState(!isFullFlowTesting())

  useEffect(() => {
    if (!ready) return

    if (user) {
      setIntroSeen(true)
      setSplashDone(true)
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const boot = async () => {
      const seen = await hasSeenIntro()
      if (cancelled) return

      if (isFullFlowTesting()) {
        timer = setTimeout(() => {
          if (!cancelled) {
            setIntroSeen(seen)
            setSplashDone(true)
          }
        }, TESTING_SPLASH_MS)
        return
      }

      setIntroSeen(seen)
      setSplashDone(true)
    }

    void boot()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [ready, user])

  const completeIntro = async () => {
    await markIntroSeen()
    setIntroSeen(true)
  }

  if (!user) {
    if (!ready || introSeen === null || !splashDone) {
      return <SplashLoading />
    }

    if (!introSeen) {
      return (
        <SafeAreaView style={styles.app} edges={['top', 'bottom']}>
          <StatusBar style="dark" />
          <IntroOnboardingScreen onComplete={completeIntro} />
        </SafeAreaView>
      )
    }

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
      <>
        <SafeAreaView style={styles.app} edges={['top', 'bottom']}>
          <StatusBar style="dark" />
          <HostVerificationScreen />
        </SafeAreaView>
        <BiometricOverlays />
      </>
    )
  }

  return (
    <>
      <NotificationProvider activeUserId={user!.id}>
        <ToastProvider>
          <AppProvider>
            <AppShell />
          </AppProvider>
        </ToastProvider>
      </NotificationProvider>
      <BiometricOverlays />
    </>
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
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: { flex: 1 },
  bottomNavWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
})
