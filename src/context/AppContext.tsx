import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { HOSTS, INITIAL_REQUEST } from '../data/mockData'
import type {
  AppRole,
  Booking,
  BookingStage,
  DropOffTime,
  Host,
  HostRequest,
  Screen,
  SheetsOption,
} from '../types'

interface AppState {
  role: AppRole
  screen: Screen
  selectedHost: Host | null
  booking: Booking | null
  hostRequest: HostRequest | null
  activeLoad: Booking | null
  showMap: boolean
  setRole: (role: AppRole) => void
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<AppRole>('customer')
  const [screen, setScreen] = useState<Screen>('customer-home')
  const [selectedHost, setSelectedHost] = useState<Host | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [hostRequest, setHostRequest] = useState<HostRequest | null>(INITIAL_REQUEST)
  const [activeLoad, setActiveLoad] = useState<Booking | null>(null)
  const [showMap, setShowMap] = useState(false)

  const setRole = useCallback((next: AppRole) => {
    setRoleState(next)
    setScreen(next === 'customer' ? 'customer-home' : 'host-dashboard')
  }, [])

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
      if (!selectedHost) return
      const newBooking: Booking = {
        id: `bk-${Date.now()}`,
        hostId: selectedHost.id,
        hostName: selectedHost.name,
        customerName: 'You',
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
    [selectedHost],
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
      role,
      screen,
      selectedHost,
      booking,
      hostRequest,
      activeLoad,
      showMap,
      setRole,
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
      role,
      screen,
      selectedHost,
      booking,
      hostRequest,
      activeLoad,
      showMap,
      setRole,
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
