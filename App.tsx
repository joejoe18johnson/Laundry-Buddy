import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useMemo, useState, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './src/components/AppIcon'
import { BiometricSetupPrompt } from './src/components/BiometricSetupPrompt'
import { BottomNav, type NavTab } from './src/components/BottomNav'
import { AppProvider, useApp } from './src/context/AppContext'
import { AuthProvider, needsIdentityVerification, useAuth } from './src/context/AuthContext'
import { NotificationProvider, useUserNotifications } from './src/context/NotificationContext'
import { MessageProvider } from './src/context/MessageContext'
import { HomeScreen } from './src/screens/customer/HomeScreen'
import { BookingScreen } from './src/screens/customer/BookingScreen'
import { HostProfileScreen } from './src/screens/customer/HostProfileScreen'
import { TrackingScreen } from './src/screens/customer/TrackingScreen'
import { LeaveReviewScreen } from './src/screens/customer/LeaveReviewScreen'
import { DashboardScreen } from './src/screens/host/DashboardScreen'
import { HostHubScreen } from './src/screens/host/HostHubScreen'
import { MarkDryScreen } from './src/screens/host/MarkDryScreen'
import { WelcomeScreen } from './src/screens/auth/WelcomeScreen'
import { IntroOnboardingScreen } from './src/screens/auth/IntroOnboardingScreen'
import { LoginScreen } from './src/screens/auth/LoginScreen'
import { SignupScreen } from './src/screens/auth/SignupScreen'
import { HeaderMenu } from './src/components/HeaderMenu'
import { LocationSettingsSheet } from './src/components/LocationSettingsSheet'
import { IdentityVerificationScreen } from './src/screens/auth/IdentityVerificationScreen'
import { HistoryScreen } from './src/screens/shared/HistoryScreen'
import { AccountScreen } from './src/screens/shared/AccountScreen'
import { HelpScreen } from './src/screens/shared/HelpScreen'
import { NotificationsScreen } from './src/screens/shared/NotificationsScreen'
import { ChatScreen } from './src/screens/shared/ChatScreen'
import { BrandSwitch } from './src/components/ui'
import { colors, spacing } from './src/theme'
import { ThemeProvider, useTheme } from './src/context/ThemeContext'
import { hasSeenIntro, markIntroSeen } from './src/lib/introStorage'
import { isFullFlowTesting, TESTING_SPLASH_MS } from './src/lib/testingFlow'
import { SplashLoading } from './src/components/SplashLoading'
import { NotificationPermissionPrompt } from './src/components/NotificationPermissionPrompt'
import { ToastProvider } from './src/context/ToastContext'
import {
  addNotificationResponseListener,
  requestPushPermissions,
  shouldPromptForPushAfterAuth,
} from './src/lib/pushNotifications'
import { getGreetingName } from './src/lib/displayName'
import type { Screen } from './src/types'

SplashScreen.preventAutoHideAsync().catch(() => {})

const HIDE_BOTTOM_NAV: Screen[] = [
  'customer-booking',
  'customer-host-profile',
  'customer-leave-review',
  'host-mark-dry',
  'notifications',
  'help',
  'chat',
]

function AppShell() {
  const { user, logout } = useAuth()
  const { colors, isDark, setColorScheme } = useTheme()
  const shellStyles = useMemo(
    () =>
      StyleSheet.create({
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
        headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        themeToggle: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingRight: 2,
        },
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
      }),
    [colors],
  )
  const {
    screen,
    activeGuestBookings,
    navigate,
    hostSettings,
    userLocationLabel,
    searchRadiusKm,
    userLocation,
    locationLoading,
    fetchGpsLocation,
    applyLocationPreferences,
    openNotificationFromPush,
  } = useApp()
  const { unreadCount } = useUserNotifications(user!.id)
  const [menuOpen, setMenuOpen] = useState(false)
  const [locationSettingsOpen, setLocationSettingsOpen] = useState(false)

  const isCustomer = user!.role === 'customer'
  const greetingName = getGreetingName(user!.name)
  const isHome = screen === 'customer-home'

  const loadNeedsAttention = activeGuestBookings.length > 0

  const hasActiveLoad = activeGuestBookings.length > 0

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
        label: 'My loads',
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
    const subscription = addNotificationResponseListener((title, data) => {
      void openNotificationFromPush(title, data)
    })
    return () => subscription.remove()
  }, [openNotificationFromPush])

  return (
    <SafeAreaView style={shellStyles.app} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[shellStyles.header, isHome && shellStyles.headerHome]}>
        <Text style={shellStyles.greetingLarge}>Hi {greetingName}</Text>
        <View style={shellStyles.headerRight}>
          <View style={shellStyles.themeToggle}>
            <BrandSwitch
              value={isDark}
              onValueChange={(enabled) => setColorScheme(enabled ? 'dark' : 'light')}
              accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            />
          </View>
          <Pressable onPress={() => navigate('notifications')} style={shellStyles.bellBtn} hitSlop={8}>
            <AppIcon name="bell" size={22} color={colors.black} />
            {unreadCount > 0 && (
              <View style={shellStyles.bellBadge}>
                <Text style={shellStyles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => setMenuOpen(true)} style={shellStyles.menuBtn} hitSlop={8}>
            <AppIcon name="menu" size={22} color={colors.black} />
          </Pressable>
        </View>
      </View>

      <HeaderMenu
        visible={menuOpen}
        user={user!}
        onClose={() => setMenuOpen(false)}
        locationLabel={userLocationLabel}
        radiusKm={searchRadiusKm}
        onOpenLocationSettings={isCustomer ? () => setLocationSettingsOpen(true) : undefined}
        hasActiveLoad={hasActiveLoad}
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

      {isCustomer ? (
        <LocationSettingsSheet
          visible={locationSettingsOpen}
          onClose={() => setLocationSettingsOpen(false)}
          saved={{
            userLocation,
            userLocationLabel,
            searchRadiusKm,
          }}
          locating={locationLoading}
          onFetchGps={fetchGpsLocation}
          onSave={applyLocationPreferences}
        />
      ) : null}

      <View style={shellStyles.main}>
        {screen === 'customer-home' && <HomeScreen />}
        {screen === 'customer-host-profile' && <HostProfileScreen />}
        {screen === 'customer-booking' && <BookingScreen />}
        {screen === 'customer-tracking' && <TrackingScreen />}
        {screen === 'customer-leave-review' && <LeaveReviewScreen />}
        {screen === 'host-dashboard' && <DashboardScreen />}
        {screen === 'host-mark-dry' && <MarkDryScreen />}
        {screen === 'history' && <HistoryScreen />}
        {screen === 'account' && (isCustomer ? <AccountScreen /> : <HostHubScreen />)}
        {screen === 'help' && <HelpScreen />}
        {screen === 'notifications' && <NotificationsScreen />}
        {screen === 'chat' && <ChatScreen />}
      </View>

      {showBottomNav && (
        <SafeAreaView edges={['bottom']} style={shellStyles.bottomNavWrap}>
          <BottomNav tabs={tabs} currentScreen={screen} onNavigate={navigate} />
        </SafeAreaView>
      )}

    </SafeAreaView>
  )
}

function PushNotificationPromptGate() {
  const { user, authSessionKey, showBiometricSetupPrompt } = useAuth()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!user || showBiometricSetupPrompt) {
      setVisible(false)
      return
    }

    let cancelled = false
    void shouldPromptForPushAfterAuth().then((shouldPrompt) => {
      if (!cancelled && shouldPrompt) setVisible(true)
    })

    return () => {
      cancelled = true
    }
  }, [user, authSessionKey, showBiometricSetupPrompt])

  if (!user) return null

  return (
    <NotificationPermissionPrompt
      visible={visible}
      onEnable={() => {
        void requestPushPermissions().then(() => setVisible(false))
      }}
      onDismiss={() => setVisible(false)}
    />
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
        <SafeAreaView style={authStyles.app} edges={['top', 'bottom']}>
          <StatusBar style="dark" />
          <IntroOnboardingScreen onComplete={completeIntro} />
        </SafeAreaView>
      )
    }

    return (
      <SafeAreaView style={authStyles.app} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        {authScreen === 'welcome' && <WelcomeScreen />}
        {authScreen === 'login' && <LoginScreen />}
        {authScreen === 'signup' && <SignupScreen />}
      </SafeAreaView>
    )
  }

  if (needsIdentityVerification(user)) {
    return (
      <>
        <NotificationProvider activeUserId={user!.id}>
          <MessageProvider>
            <SafeAreaView style={authStyles.app} edges={['top', 'bottom']}>
              <StatusBar style="dark" />
              <IdentityVerificationScreen />
            </SafeAreaView>
          </MessageProvider>
        </NotificationProvider>
        <BiometricOverlays />
        <PushNotificationPromptGate />
      </>
    )
  }

  return (
    <>
      <NotificationProvider activeUserId={user!.id}>
        <MessageProvider>
          <ToastProvider>
            <AppProvider>
              <AppShell />
            </AppProvider>
          </ToastProvider>
        </MessageProvider>
      </NotificationProvider>
      <BiometricOverlays />
      <PushNotificationPromptGate />
    </>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

const authStyles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.white },
})
