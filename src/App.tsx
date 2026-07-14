import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, needsHostVerification, useAuth } from './context/AuthContext'
import { HomeScreen } from './screens/customer/HomeScreen'
import { BookingScreen } from './screens/customer/BookingScreen'
import { TrackingScreen } from './screens/customer/TrackingScreen'
import { DashboardScreen } from './screens/host/DashboardScreen'
import { MarkDryScreen } from './screens/host/MarkDryScreen'
import { WelcomeScreen } from './screens/auth/WelcomeScreen'
import { LoginScreen } from './screens/auth/LoginScreen'
import { SignupScreen } from './screens/auth/SignupScreen'
import { HostVerificationScreen } from './screens/auth/HostVerificationScreen'
import './App.css'

function AppShell() {
  const { user, logout } = useAuth()
  const { screen, booking, navigate } = useApp()

  const isCustomer = user!.role === 'customer'
  const showTabBar = isCustomer && booking && screen !== 'customer-tracking'

  return (
    <div className="app">
      <header className="app-bar">
        <span className="app-logo">Laundry Buddy</span>
        <div className="app-bar-actions">
          <span className="user-greeting">{user!.name}</span>
          <button type="button" className="logout-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className={`app-main ${showTabBar ? 'has-tab-bar' : ''}`}>
        {screen === 'customer-home' && <HomeScreen />}
        {screen === 'customer-booking' && <BookingScreen />}
        {screen === 'customer-tracking' && <TrackingScreen />}
        {screen === 'host-dashboard' && <DashboardScreen />}
        {screen === 'host-mark-dry' && <MarkDryScreen />}
      </main>

      {showTabBar && (
        <nav className="tab-bar">
          <button type="button" onClick={() => navigate('customer-home')}>
            Explore
          </button>
          <button type="button" className="active" onClick={() => navigate('customer-tracking')}>
            My load
          </button>
        </nav>
      )}
    </div>
  )
}

function AuthenticatedApp() {
  const { user, authScreen } = useAuth()

  if (!user) {
    return (
      <div className="app">
        {authScreen === 'welcome' && <WelcomeScreen />}
        {authScreen === 'login' && <LoginScreen />}
        {authScreen === 'signup' && <SignupScreen />}
      </div>
    )
  }

  if (needsHostVerification(user)) {
    return (
      <div className="app">
        <HostVerificationScreen />
      </div>
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
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}
