import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { AppState, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './src/components/AppIcon'
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
import { HostDryerScreen } from './src/screens/host/HostDryerScreen'
import { HostHubScreen } from './src/screens/host/HostHubScreen'
import { MarkDryScreen } from './src/screens/host/MarkDryScreen'
import { WelcomeScreen } from './src/screens/auth/WelcomeScreen'
import { IntroOnboardingScreen } from './src/screens/auth/IntroOnboardingScreen'
import { LoginScreen } from './src/screens/auth/LoginScreen'
import { SignupScreen } from './src/screens/auth/SignupScreen'
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPasswordScreen'
import { ResetPasswordScreen } from './src/screens/auth/ResetPasswordScreen'
import { HeaderMenu } from './src/components/HeaderMenu'
import { LocationSettingsSheet } from './src/components/LocationSettingsSheet'
import { IdentityVerificationScreen } from './src/screens/auth/IdentityVerificationScreen'
import { HistoryScreen } from './src/screens/shared/HistoryScreen'
import { AccountScreen } from './src/screens/shared/AccountScreen'
import { HelpScreen } from './src/screens/shared/HelpScreen'
import { TermsScreen } from './src/screens/shared/TermsScreen'
import { PrivacyScreen } from './src/screens/shared/PrivacyScreen'
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
import { AdminSupportMessagesScreen } from './src/screens/admin/AdminSupportMessagesScreen'
import { useAdminDashboardData } from './src/hooks/useAdminDashboardData'
import { useAdminSupportMessages } from './src/hooks/useAdminSupportMessages'
import { ChatScreen, ChatThreadPanel } from './src/screens/shared/ChatScreen'
import { colors, spacing } from './src/theme'
import { ThemeProvider, useTheme } from './src/context/ThemeContext'
import { hasSeenIntro, markIntroSeen } from './src/lib/introStorage'
import { isFullFlowTesting, TESTING_SPLASH_MS } from './src/lib/testingFlow'
import { SplashLoading } from './src/components/SplashLoading'
import { NotificationPermissionPrompt } from './src/components/NotificationPermissionPrompt'
import { AdminVerificationRequestSync } from './src/components/AdminVerificationRequestSync'
import { GuestBookingSync } from './src/components/GuestBookingSync'
import { HostBookingSync } from './src/components/HostBookingSync'
import { HostRequestAlertSync } from './src/components/HostRequestAlertSync'
import { BookingStepAlertSync } from './src/components/BookingStepAlertSync'
import { VerificationStatusSync } from './src/components/VerificationStatusSync'
import { ToastProvider } from './src/context/ToastContext'
import {
  addNotificationResponseListener,
  getPushPermissionStatus,
  openNotificationSettings,
  requestPushPermissions,
  type PushPermissionStatus,
} from './src/lib/pushNotifications'
import { getGreetingName } from './src/lib/displayName'
import { countDryerTabLoads } from './src/lib/hostLoads'
import { linkFromPushData } from './src/lib/notificationLinks'
import { VERIFICATION_CODE_REQUEST_TITLE } from './src/lib/verificationCodes'
import type { Screen } from './src/types'

SplashScreen.preventAutoHideAsync().catch(() => {})

const HIDE_BOTTOM_NAV: Screen[] = [
  'customer-booking',
  'customer-host-profile',
  'customer-leave-review',
  'host-mark-dry',
  'notifications',
  'help',
  'terms',
  'privacy',
  'chat',
  'identity-verification',
]

function AdminAppShell() {
  const { user, logout, refreshCurrentUser } = useAuth()
  const { colors } = useTheme()
  const { unreadCount } = useUserNotifications(user!.id)
  const adminHistoryRef = useRef<
    ('overview' | 'queue' | 'users' | 'codes' | 'support' | 'support-chat' | 'notifications' | 'user-review')[]
  >([])
  const [screen, setScreen] = useState<
    'overview' | 'queue' | 'users' | 'codes' | 'support' | 'support-chat' | 'notifications' | 'user-review'
  >('overview')
  const [highlightUserId, setHighlightUserId] = useState<string | undefined>()
  const [reviewUserId, setReviewUserId] = useState<string | null>(null)
  const [supportThreadId, setSupportThreadId] = useState<string | null>(null)
  const [supportThreadTitle, setSupportThreadTitle] = useState('')
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0)
  const { queueCount } = useAdminDashboardData(dashboardRefreshKey)
  const { totalUnread: supportUnreadCount } = useAdminSupportMessages(dashboardRefreshKey)

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    void refreshCurrentUser()
  }, [refreshCurrentUser, user?.id, user?.role])

  useEffect(() => {
    if (!user || user.role !== 'admin') return

    const subscription = addNotificationResponseListener((title, data) => {
      const link = linkFromPushData(data)
      if (link?.screen === 'admin-dashboard' && link.userId) {
        setHighlightUserId(link.userId)
        openUserReview(link.userId)
        return
      }
      if (title === VERIFICATION_CODE_REQUEST_TITLE) {
        setScreen('queue')
      }
    })

    return () => subscription.remove()
  }, [user?.id, user?.role])

  const navigateAdmin = (
    next: 'overview' | 'queue' | 'users' | 'codes' | 'support' | 'support-chat' | 'notifications' | 'user-review',
  ) => {
    setScreen((current) => {
      if (current !== next) adminHistoryRef.current.push(current)
      return next
    })
  }

  const openUserReview = (userId: string) => {
    setReviewUserId(userId)
    navigateAdmin('user-review')
  }

  const handleReviewUpdated = () => {
    setDashboardRefreshKey((key) => key + 1)
  }

  const goBackAdmin = useCallback(() => {
    if (screen === 'user-review') {
      setReviewUserId(null)
      setScreen('queue')
      return true
    }
    if (screen === 'support-chat') {
      setScreen('support')
      return true
    }
    const history = adminHistoryRef.current
    if (history.length > 0) {
      setScreen(history.pop()!)
      return true
    }
    if (screen === 'overview') {
      setDashboardRefreshKey((key) => key + 1)
      return true
    }
    setScreen('overview')
    return true
  }, [screen])

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', goBackAdmin)
    return () => subscription.remove()
  }, [goBackAdmin])

  const adminTab: AdminTabId =
    screen === 'queue' ||
    screen === 'users' ||
    screen === 'codes' ||
    screen === 'overview' ||
    screen === 'support'
      ? screen
      : 'overview'

  const openSupportThread = (threadId: string, title: string) => {
    setSupportThreadId(threadId)
    setSupportThreadTitle(title)
    navigateAdmin('support-chat')
  }

  const headerTitle =
    screen === 'overview'
      ? 'Overview'
      : screen === 'queue'
        ? 'Verification queue'
        : screen === 'users'
          ? 'All users'
          : screen === 'codes'
            ? 'Verification codes'
            : screen === 'support'
              ? 'Support messages'
              : screen === 'support-chat'
                ? supportThreadTitle || 'Support chat'
                : screen === 'notifications'
                  ? 'Notifications'
                  : 'Support admin'

  const adminTabs = useMemo(
    () => [
      { id: 'overview' as const, label: 'Overview', icon: 'home' as const },
      { id: 'queue' as const, label: 'Queue', icon: 'inbox' as const, badgeCount: queueCount },
      { id: 'support' as const, label: 'Messages', icon: 'message-circle' as const, badgeCount: supportUnreadCount },
      { id: 'users' as const, label: 'Users', icon: 'users' as const },
      { id: 'codes' as const, label: 'Codes', icon: 'key' as const },
    ],
    [queueCount, supportUnreadCount],
  )

  const showAdminNav =
    screen !== 'user-review' && screen !== 'notifications' && screen !== 'support-chat'

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
      <AdminVerificationRequestSync onNewRequest={() => setDashboardRefreshKey((key) => key + 1)} />
      {screen !== 'user-review' && screen !== 'support-chat' ? (
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
            supportUnreadCount={supportUnreadCount}
            onNavigate={(section) => {
              if (section === 'support') {
                navigateAdmin('support')
                return
              }
              navigateAdmin(section)
            }}
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
        ) : screen === 'support' ? (
          <AdminSupportMessagesScreen
            refreshKey={dashboardRefreshKey}
            onOpenThread={openSupportThread}
          />
        ) : screen === 'support-chat' && supportThreadId ? (
          <ChatThreadPanel
            threadId={supportThreadId}
            titleOverride={supportThreadTitle}
            subtitleOverride="In-app support"
            onBack={() => navigateAdmin(adminTab)}
          />
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
          <AdminBottomNav tabs={adminTabs} currentTab={adminTab} onNavigate={navigateAdmin} />
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
    activeLoads,
    activeGuestBookings,
    navigate,
    goBack,
    homeRefreshKey,
    hostSettings,
    userLocationLabel,
    searchRadiusMiles,
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
  const dryerLoadCount = countDryerTabLoads(activeLoads)

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
        id: 'dryer',
        label: 'Dryer',
        icon: 'wind',
        screen: 'host-dryer',
        matchScreens: ['host-dryer', 'host-mark-dry'],
        badge: dryerLoadCount > 0,
        badgeCount: dryerLoadCount,
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
    [dryerLoadCount, pendingRequestCount, totalUnreadCount],
  )

  const tabs = isCustomer ? customerTabs : hostTabs
  const showBottomNav = !HIDE_BOTTOM_NAV.includes(screen)
  const showAppHeader = !HIDE_BOTTOM_NAV.includes(screen)

  useEffect(() => {
    const subscription = addNotificationResponseListener((title, data) => {
      void openNotificationFromPush(title, data)
    })
    return () => subscription.remove()
  }, [openNotificationFromPush])

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', goBack)
    return () => subscription.remove()
  }, [goBack])

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
        radiusMiles={searchRadiusMiles}
        onOpenLocationSettings={() => setLocationSettingsOpen(true)}
        hasActiveLoad={hasActiveLoad}
        isHostOnline={hostSettings?.isOnline}
        notificationCount={unreadCount}
        onExplore={isCustomer ? () => navigate('customer-home') : undefined}
        onMyLoad={isCustomer ? () => navigate('customer-tracking') : undefined}
        onPastLoads={isCustomer ? () => navigate('history') : undefined}
        onAccount={() => navigate('account')}
        onContactSupport={openSupportChat}
        onHelp={() => navigate('help')}
        onTerms={() => navigate('terms')}
        onPrivacy={() => navigate('privacy')}
        onNotifications={() => navigate('notifications')}
        onLogout={logout}
      />

      <LocationSettingsSheet
        visible={locationSettingsOpen}
        onClose={() => setLocationSettingsOpen(false)}
        saved={{
          userLocation,
          userLocationLabel,
          searchRadiusMiles,
        }}
        locating={locationLoading}
        onFetchGps={fetchGpsLocation}
        onSave={applyLocationPreferences}
      />

      <View style={shellStyles.main}>
        {screen === 'customer-home' && <HomeScreen refreshKey={homeRefreshKey} />}
        {screen === 'customer-host-profile' && <HostProfileScreen />}
        {screen === 'customer-booking' && <BookingScreen />}
        {screen === 'customer-tracking' && <TrackingScreen />}
        {screen === 'customer-leave-review' && <LeaveReviewScreen />}
        {screen === 'host-dashboard' && <DashboardScreen />}
        {screen === 'host-dryer' && <HostDryerScreen />}
        {screen === 'host-mark-dry' && <MarkDryScreen />}
        {screen === 'history' && <HistoryScreen />}
        {screen === 'messages' && <MessagesScreen />}
        {screen === 'account' && (isCustomer ? <AccountScreen /> : <HostHubScreen />)}
        {screen === 'help' && <HelpScreen />}
        {screen === 'terms' && <TermsScreen />}
        {screen === 'privacy' && <PrivacyScreen />}
        {screen === 'notifications' && <NotificationsScreen />}
        {screen === 'chat' && <ChatScreen />}
        {screen === 'identity-verification' && (
          <IdentityVerificationScreen
            onBrowse={() => navigate('customer-home')}
          />
        )}
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
  const { user, authSessionKey } = useAuth()
  const [visible, setVisible] = useState(false)
  const [permission, setPermission] = useState<PushPermissionStatus>('undetermined')
  const [dismissedForSession, setDismissedForSession] = useState(false)

  useEffect(() => {
    setDismissedForSession(false)
    setVisible(false)
  }, [authSessionKey])

  const syncPermissionPrompt = useCallback(async () => {
    if (!user) {
      setVisible(false)
      return
    }

    if (dismissedForSession) return

    const status = await getPushPermissionStatus()
    setPermission(status)

    if (status === 'granted' || status === 'unsupported') {
      setVisible(false)
      return
    }

    setVisible(true)
  }, [dismissedForSession, user])

  useEffect(() => {
    void syncPermissionPrompt()
  }, [authSessionKey, syncPermissionPrompt])

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
          if (status === 'granted' || status === 'unsupported') {
            setVisible(false)
          }
        })()
      }}
      onDismiss={() => {
        setDismissedForSession(true)
        setVisible(false)
      }}
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
        {authScreen === 'forgot-password' && <ForgotPasswordScreen />}
        {authScreen === 'reset-password' && <ResetPasswordScreen />}
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
                <AppProvider>
                  <VerificationStatusSync />
                  <HostRequestAlertSync />
                  <BookingStepAlertSync />
                  <GuestBookingSync />
                  <HostBookingSync />
                  <AppShell />
                </AppProvider>
              </>
            )}
          </ToastProvider>
        </MessageProvider>
      </NotificationProvider>
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
