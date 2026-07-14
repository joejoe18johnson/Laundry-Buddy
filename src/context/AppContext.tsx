import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { HOSTS, INITIAL_REQUEST } from '../data/mockData'
import type {
  Booking,
  BookingStage,
  DropOffTime,
  Host,
  HostRequest,
  Screen,
  SheetsOption,
} from '../types'

interface AppState {
  screen: Screen
  selectedHost: Host | null
  booking: Booking | null
  hostRequest: HostRequest | null
  activeLoad: Booking | null
  showMap: boolean
  navigate: (screen: Screen) => void
  selectHost: (host: Host) => void
  setShowMap: (show: boolean) => void
  confirmBooking: (details: {
    dropOffTime: DropOffTime
    loads: number
    sheetsOption: SheetsOption
    notes: string
  }) => void
  acceptRequest: () => void
  declineRequest: () => void
  advanceStage: (stage: BookingStage) => void
  markDry: () => void
}

const AppContext = createContext<AppState | null>(null)

function nowTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function defaultScreen(role: 'customer' | 'host'): Screen {
  return role === 'host' ? 'host-dashboard' : 'customer-home'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const role = user!.role

  const [screen, setScreen] = useState<Screen>(() => defaultScreen(role))
  const [selectedHost, setSelectedHost] = useState<Host | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [hostRequest, setHostRequest] = useState<HostRequest | null>(INITIAL_REQUEST)
  const [activeLoad, setActiveLoad] = useState<Booking | null>(null)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    setScreen(defaultScreen(role))
  }, [role])

  const navigate = useCallback((next: Screen) => setScreen(next), [])

  const selectHost = useCallback((host: Host) => {
    setSelectedHost(host)
    setScreen('customer-booking')
  }, [])

  const confirmBooking = useCallback(
    (details: {
      dropOffTime: DropOffTime
      loads: number
      sheetsOption: SheetsOption
      notes: string
    }) => {
      if (!selectedHost || !user) return
      const newBooking: Booking = {
        id: `bk-${Date.now()}`,
        hostId: selectedHost.id,
        hostName: selectedHost.name,
        customerName: user.name,
        location: selectedHost.location,
        loads: details.loads,
        dropOffTime: details.dropOffTime,
        sheetsOption: details.sheetsOption,
        notes: details.notes,
        stage: 'got-bag',
        address: selectedHost.address,
        gateCode: selectedHost.gateCode,
        stageTimes: { 'got-bag': nowTime() },
        isNew: true,
      }
      setBooking(newBooking)
      setScreen('customer-tracking')
    },
    [selectedHost, user],
  )

  const acceptRequest = useCallback(() => {
    if (!hostRequest) return
    const host = HOSTS[0]
    const load: Booking = {
      id: 'load-carlos',
      hostId: host.id,
      hostName: host.name,
      customerName: 'Carlos',
      location: 'Las Flores',
      loads: 1,
      dropOffTime: '2pm-4pm',
      sheetsOption: 'own',
      notes: '',
      stage: 'got-bag',
      address: host.address,
      gateCode: host.gateCode,
      stageTimes: { 'got-bag': '9:12am' },
    }
    setActiveLoad(load)
    setHostRequest(null)
  }, [hostRequest])

  const declineRequest = useCallback(() => setHostRequest(null), [])

  const advanceStage = useCallback((stage: BookingStage) => {
    setActiveLoad((prev) =>
      prev
        ? { ...prev, stage, stageTimes: { ...prev.stageTimes, [stage]: nowTime() } }
        : prev,
    )
    setBooking((prev) =>
      prev
        ? { ...prev, stage, stageTimes: { ...prev.stageTimes, [stage]: nowTime() } }
        : prev,
    )
  }, [])

  const markDry = useCallback(() => {
    advanceStage('ready')
    setScreen('host-dashboard')
  }, [advanceStage])

  const value = useMemo(
    () => ({
      screen,
      selectedHost,
      booking,
      hostRequest,
      activeLoad,
      showMap,
      navigate,
      selectHost,
      setShowMap,
      confirmBooking,
      acceptRequest,
      declineRequest,
      advanceStage,
      markDry,
    }),
    [
      screen,
      selectedHost,
      booking,
      hostRequest,
      activeLoad,
      showMap,
      navigate,
      selectHost,
      confirmBooking,
      acceptRequest,
      declineRequest,
      advanceStage,
      markDry,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
