import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './src/components/AppIcon'
import { AppProvider, useApp } from './src/context/AppContext'
import { AuthProvider, needsHostVerification, useAuth } from './src/context/AuthContext'
import { HomeScreen } from './src/screens/customer/HomeScreen'
import { BookingScreen } from './src/screens/customer/BookingScreen'
import { TrackingScreen } from './src/screens/customer/TrackingScreen'
import { DashboardScreen } from './src/screens/host/DashboardScreen'
import { MarkDryScreen } from './src/screens/host/MarkDryScreen'
import { WelcomeScreen } from './src/screens/auth/WelcomeScreen'
import { LoginScreen } from './src/screens/auth/LoginScreen'
import { SignupScreen } from './src/screens/auth/SignupScreen'
import { HostVerificationScreen } from './src/screens/auth/HostVerificationScreen'
import { colors, spacing } from './src/theme'

SplashScreen.preventAutoHideAsync().catch(() => {})

function AppShell() {
  const { user, logout } = useAuth()
  const { screen, booking, navigate } = useApp()

  const isCustomer = user!.role === 'customer'
  const showTabBar = isCustomer && booking && screen !== 'customer-tracking'

  return (
    <SafeAreaView style={styles.app} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <AppIcon name="wind" size={18} color={colors.accent} />
          <Text style={styles.logo}>Laundry Buddy</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.profile}>
            <View style={styles.profileIcon}>
              <AppIcon name="user" size={14} />
            </View>
            <Text style={styles.greeting}>{user!.name}</Text>
          </View>
          <Pressable onPress={logout} style={styles.logout}>
            <AppIcon name="log-out" size={14} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.main, showTabBar && styles.mainWithTab]}>
        {screen === 'customer-home' && <HomeScreen />}
        {screen === 'customer-booking' && <BookingScreen />}
        {screen === 'customer-tracking' && <TrackingScreen />}
        {screen === 'host-dashboard' && <DashboardScreen />}
        {screen === 'host-mark-dry' && <MarkDryScreen />}
      </View>

      {showTabBar && (
        <SafeAreaView edges={['bottom']} style={styles.tabBar}>
          <Pressable style={styles.tab} onPress={() => navigate('customer-home')}>
            <AppIcon
              name="search"
              size={20}
              color={screen === 'customer-home' ? colors.black : colors.gray500}
            />
            <Text style={[styles.tabText, screen === 'customer-home' && styles.tabTextActive]}>Explore</Text>
          </Pressable>
          <Pressable style={styles.tab} onPress={() => navigate('customer-tracking')}>
            <AppIcon
              name="package"
              size={20}
              color={screen === 'customer-tracking' ? colors.black : colors.gray500}
            />
            <Text style={[styles.tabText, screen === 'customer-tracking' && styles.tabTextActive]}>My load</Text>
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
    <AppProvider>
      <AppShell />
    </AppProvider>
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
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: { fontSize: 17, fontWeight: '700', color: colors.accent },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  logoutText: { fontSize: 12, fontWeight: '600' },
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
