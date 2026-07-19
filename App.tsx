import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useCallback, useMemo, useState, useEffect } from 'react'
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './src/components/AppIcon'
import { BiometricSetupPrompt } from './src/components/BiometricSetupPrompt'
import { BottomNav, type NavTab } from './src/components/BottomNav'
import { AppProvider, useApp } from './src/context/AppContext'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { NotificationProvider, useUserNotifications } from './src/context/NotificationContext'
import { MessageProvider, useMessages } from './src/context/MessageContext'
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
import { MessagesScreen } from './src/screens/shared/MessagesScreen'
import { AdminBottomNav, type AdminTabId } from './src/components/AdminBottomNav'
import { UnreadCountBadge } from './src/components/UnreadCountBadge'
import { AdminNotificationsScreen } from './src/screens/admin/AdminNotificationsScreen'
import { AdminOverviewScreen } from './src/screens/admin/AdminOverviewScreen'
import { AdminUserReviewScreen } from './src/screens/admin/AdminUserReviewScreen'
import { AdminUsersScreen } from './src/screens/admin/AdminUsersScreen'
import { AdminVerificationCodesScreen } from './src/screens/admin/AdminVerificationCodesScreen'
import { AdminVerificationQueueScreen } from './src/screens/admin/AdminVerificationQueueScreen'
import { useAdminDashboardData } from './src/hooks/useAdminDashboardData'
import { ChatScreen } from './src/screens/shared/ChatScreen'
import { colors, spacing } from './src/theme'
import { ThemeProvider, useTheme } from './src/context/ThemeContext'
import { hasSeenIntro, markIntroSeen } from './src/lib/introStorage'
import { isFullFlowTesting, TESTING_SPLASH_MS } from './src/lib/testingFlow'
import { SplashLoading } from './src/components/SplashLoading'
import { NotificationPermissionPrompt } from './src/components/NotificationPermissionPrompt'
import { HostRequestAlertSync } from './src/components/HostRequestAlertSync'
import { SupportChatFab } from './src/components/SupportChatFab'
import { VerificationStatusSync } from './src/components/VerificationStatusSync'
import { ToastProvider } from './src/context/ToastContext'
import {
  addNotificationResponseListener,
  ensurePushNotificationsEnabled,
  getPushPermissionStatus,
  openNotificationSettings,
  requestPushPermissions,
  type PushPermissionStatus,
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
  'identity-verification',
]

function AdminAppShell() {
  const { user, logout, refreshCurrentUser } = useAuth()
  const { colors } = useTheme()
  const { unreadCount } = useUserNotifications(user!.id)
  const [screen, setScreen] = useState<'overview' | 'queue' | 'users' | 'codes' | 'notifications' | 'user-review'>(
    'overview',
  )
  const [highlightUserId, setHighlightUserId] = useState<string | undefined>()
  const [reviewUserId, setReviewUserId] = useState<string | null>(null)
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0)
  const { queueCount } = useAdminDashboardData(dashboardRefreshKey)

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    void refreshCurrentUser()
  }, [refreshCurrentUser, user?.id, user?.role])

  const openUserReview = (userId: string) => {
    setReviewUserId(userId)
    setScreen('user-review')
  }

  const handleReviewUpdated = () => {
    setDashboardRefreshKey((key) => key + 1)
  }

  const adminTab: AdminTabId =
    screen === 'queue' || screen === 'users' || screen === 'codes' || screen === 'overview'
      ? screen
      : 'overview'

  const headerTitle =
    screen === 'overview'
      ? 'Overview'
      : screen === 'queue'
        ? 'Verification queue'
        : screen === 'users'
          ? 'All users'
          : screen === 'codes'
            ? 'Verification codes'
            : screen === 'notifications'
              ? 'Notifications'
              : 'Support admin'

  const adminTabs = useMemo(
    () => [
      { id: 'overview' as const, label: 'Overview', icon: 'home' as const },
      { id: 'queue' as const, label: 'Queue', icon: 'inbox' as const, badgeCount: queueCount },
      { id: 'users' as const, label: 'Users', icon: 'users' as const },
      { id: 'codes' as const, label: 'Codes', icon: 'key' as const },
    ],
    [queueCount],
  )

  const showAdminNav = screen !== 'user-review' && screen !== 'notifications'

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
        },
        title: { fontSize: 20, fontWeight: '700', color: colors.black, flex: 1 },
        headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        bellBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
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

  return (
    <SafeAreaView style={shellStyles.app} edges={['top']}>
      <StatusBar style="dark" />
      {screen !== 'user-review' ? (
        <View style={shellStyles.header}>
          <Text style={shellStyles.title}>{headerTitle}</Text>
          <View style={shellStyles.headerRight}>
            <Pressable
              onPress={() => setScreen(screen === 'notifications' ? adminTab : 'notifications')}
              style={shellStyles.bellBtn}
              hitSlop={8}
            >
              <AppIcon name="bell" size={22} color={colors.black} />
              {unreadCount > 0 ? (
                <View style={{ position: 'absolute', top: 2, right: 2 }}>
                  <UnreadCountBadge count={unreadCount} />
                </View>
              ) : null}
            </Pressable>
            <Pressable onPress={() => void logout()} style={shellStyles.bellBtn} hitSlop={8}>
              <AppIcon name="log-out" size={20} color={colors.black} />
            </Pressable>
          </View>
        </View>
      ) : null}
      <View style={shellStyles.main}>
        {screen === 'overview' ? (
          <AdminOverviewScreen
            refreshKey={dashboardRefreshKey}
            onNavigate={(tab) => setScreen(tab)}
          />
        ) : screen === 'queue' ? (
          <AdminVerificationQueueScreen
            highlightUserId={highlightUserId}
            refreshKey={dashboardRefreshKey}
            onReviewUser={openUserReview}
          />
        ) : screen === 'users' ? (
          <AdminUsersScreen
            highlightUserId={highlightUserId}
            refreshKey={dashboardRefreshKey}
            onReviewUser={openUserReview}
          />
        ) : screen === 'codes' ? (
          <AdminVerificationCodesScreen refreshKey={dashboardRefreshKey} />
        ) : screen === 'notifications' ? (
          <AdminNotificationsScreen
            onBack={() => setScreen(adminTab)}
            onOpenRequest={(userId) => {
              if (userId) {
                setHighlightUserId(userId)
                openUserReview(userId)
                return
              }
              setScreen('queue')
            }}
          />
        ) : reviewUserId ? (
          <AdminUserReviewScreen
            userId={reviewUserId}
            onBack={() => {
              setScreen('queue')
              setReviewUserId(null)
            }}
            onUpdated={handleReviewUpdated}
          />
        ) : null}
      </View>
      {showAdminNav ? (
        <SafeAreaView edges={['bottom']} style={shellStyles.bottomNavWrap}>
          <AdminBottomNav tabs={adminTabs} currentTab={adminTab} onNavigate={setScreen} />
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  )
}

function AppShell() {
  const { user, logout } = useAuth()
  const { colors } = useTheme()
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
        bellBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
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
    hostRequests,
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
    openSupportChat,
  } = useApp()
  const { unreadCount } = useUserNotifications(user!.id)
  const { totalUnreadCount } = useMessages()
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
        id: 'messages',
        label: 'Messages',
        icon: 'message-circle',
        screen: 'messages',
        matchScreens: ['messages'],
        badge: totalUnreadCount > 0,
        badgeCount: totalUnreadCount,
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: 'user',
        screen: 'account',
        matchScreens: ['account'],
      },
    ],
    [loadNeedsAttention, totalUnreadCount],
  )

  const pendingRequestCount = hostRequests.length

  const hostTabs: NavTab[] = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'home',
        screen: 'host-dashboard',
        matchScreens: ['host-dashboard'],
        badge: pendingRequestCount > 0,
        badgeCount: pendingRequestCount,
      },
      {
        id: 'browse',
        label: 'Browse',
        icon: 'search',
        screen: 'customer-home',
        matchScreens: ['customer-home'],
      },
      {
        id: 'messages',
        label: 'Messages',
        icon: 'message-circle',
        screen: 'messages',
        matchScreens: ['messages'],
        badge: totalUnreadCount > 0,
        badgeCount: totalUnreadCount,
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: 'user',
        screen: 'account',
        matchScreens: ['account'],
      },
    ],
    [pendingRequestCount, totalUnreadCount],
  )

  const tabs = isCustomer ? customerTabs : hostTabs
  const showBottomNav = !HIDE_BOTTOM_NAV.includes(screen)
  const showAppHeader = !HIDE_BOTTOM_NAV.includes(screen)
  const showSupportFab = screen !== 'chat' && screen !== 'messages'

  useEffect(() => {
    const subscription = addNotificationResponseListener((title, data) => {
      void openNotificationFromPush(title, data)
    })
    return () => subscription.remove()
  }, [openNotificationFromPush])

  return (
    <SafeAreaView style={shellStyles.app} edges={['top']}>
      <StatusBar style="dark" />
      {showAppHeader ? (
      <View style={[shellStyles.header, isHome && shellStyles.headerHome]}>
        <Text style={shellStyles.greetingLarge}>Hi {greetingName}</Text>
        <View style={shellStyles.headerRight}>
          <Pressable onPress={() => navigate('notifications')} style={shellStyles.bellBtn} hitSlop={8}>
            <AppIcon name="bell" size={22} color={colors.black} />
            {unreadCount > 0 ? (
              <View style={{ position: 'absolute', top: 2, right: 2 }}>
                <UnreadCountBadge count={unreadCount} />
              </View>
            ) : null}
          </Pressable>
          <Pressable onPress={() => setMenuOpen(true)} style={shellStyles.menuBtn} hitSlop={8}>
            <AppIcon name="menu" size={22} color={colors.black} />
          </Pressable>
        </View>
      </View>
      ) : null}

      <HeaderMenu
        visible={menuOpen}
        user={user!}
        onClose={() => setMenuOpen(false)}
        locationLabel={userLocationLabel}
        radiusKm={searchRadiusKm}
        onOpenLocationSettings={() => setLocationSettingsOpen(true)}
        hasActiveLoad={hasActiveLoad}
        isHostOnline={hostSettings?.isOnline}
        notificationCount={unreadCount}
        onExplore={() => navigate('customer-home')}
        onMyLoad={isCustomer ? () => navigate('customer-tracking') : undefined}
        onPastLoads={() => navigate('history')}
        onDashboard={!isCustomer ? () => navigate('host-dashboard') : undefined}
        onAccount={() => navigate('account')}
        onHelp={() => navigate('help')}
        onNotifications={() => navigate('notifications')}
        onLogout={logout}
      />

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

      <View style={shellStyles.main}>
        {screen === 'customer-home' && <HomeScreen />}
        {screen === 'customer-host-profile' && <HostProfileScreen />}
        {screen === 'customer-booking' && <BookingScreen />}
        {screen === 'customer-tracking' && <TrackingScreen />}
        {screen === 'customer-leave-review' && <LeaveReviewScreen />}
        {screen === 'host-dashboard' && <DashboardScreen />}
        {screen === 'host-mark-dry' && <MarkDryScreen />}
        {screen === 'history' && <HistoryScreen />}
        {screen === 'messages' && <MessagesScreen />}
        {screen === 'account' && (isCustomer ? <AccountScreen /> : <HostHubScreen />)}
        {screen === 'help' && <HelpScreen />}
        {screen === 'notifications' && <NotificationsScreen />}
        {screen === 'chat' && <ChatScreen />}
        {screen === 'identity-verification' && (
          <IdentityVerificationScreen
            onBrowse={() => navigate('customer-home')}
          />
        )}
      </View>

      <SupportChatFab
        visible={showSupportFab}
        aboveBottomNav={showBottomNav}
        onPress={openSupportChat}
      />

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
  const [permission, setPermission] = useState<PushPermissionStatus>('undetermined')

  const syncPermissionPrompt = useCallback(async () => {
    if (!user || showBiometricSetupPrompt) {
      setVisible(false)
      return
    }

    const status = await ensurePushNotificationsEnabled()
    setPermission(status)
    setVisible(status !== 'granted' && status !== 'unsupported')
  }, [showBiometricSetupPrompt, user])

  useEffect(() => {
    void syncPermissionPrompt()
  }, [user, authSessionKey, showBiometricSetupPrompt, syncPermissionPrompt])

  useEffect(() => {
    if (!user) return

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return
      void syncPermissionPrompt()
    })

    return () => subscription.remove()
  }, [syncPermissionPrompt, user])

  if (!user) return null

  return (
    <NotificationPermissionPrompt
      visible={visible}
      permission={permission}
      onEnable={() => {
        void (async () => {
          if (permission === 'denied') {
            await openNotificationSettings()
            return
          }
          await requestPushPermissions()
          const status = await getPushPermissionStatus()
          setPermission(status)
          setVisible(status !== 'granted' && status !== 'unsupported')
        })()
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

  return (
    <>
      <NotificationProvider activeUserId={user!.id}>
        <MessageProvider>
          <ToastProvider>
            {user!.role === 'admin' ? (
              <AdminAppShell />
            ) : (
              <>
                <VerificationStatusSync />
                <AppProvider>
                  <HostRequestAlertSync />
                  <AppShell />
                </AppProvider>
              </>
            )}
          </ToastProvider>
        </MessageProvider>
      </NotificationProvider>
      <BiometricOverlays />
      {user!.role !== 'admin' ? <PushNotificationPromptGate /> : null}
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
