import { AppProvider, useApp } from './context/AppContext'
import { RoleSwitch } from './components/RoleSwitch'
import { HomeScreen } from './screens/customer/HomeScreen'
import { BookingScreen } from './screens/customer/BookingScreen'
import { TrackingScreen } from './screens/customer/TrackingScreen'
import { DashboardScreen } from './screens/host/DashboardScreen'
import { MarkDryScreen } from './screens/host/MarkDryScreen'
import './App.css'

function AppShell() {
  const { screen, role, booking, navigate } = useApp()

  const showTabBar = role === 'customer' && booking && screen !== 'customer-tracking'

  return (
    <div className="app">
      <header className="app-bar">
        <span className="app-logo">Laundry Buddy</span>
        <RoleSwitch />
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

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
