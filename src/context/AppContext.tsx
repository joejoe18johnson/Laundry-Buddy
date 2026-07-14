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
import {
  getCustomerSeedBooking,
  getHostByUserId,
  getHostDashboardSeed,
} from '../data/mockData'
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
  hostRequests: HostRequest[]
  activeLoads: Booking[]
  hostStats: { loadsToday: number; maxLoads: number; accepting: boolean }
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
  acceptRequest: (requestId: string) => void
  declineRequest: (requestId: string) => void
  advanceStage: (loadId: string, stage: BookingStage) => void
  markDry: (loadId: string) => void
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

  const hostSeed = role === 'host' ? getHostDashboardSeed(user!.id) : null
  const customerSeed = role === 'customer' ? getCustomerSeedBooking(user!.id) : null

  const [screen, setScreen] = useState<Screen>(() => defaultScreen(role))
  const [selectedHost, setSelectedHost] = useState<Host | null>(null)
  const [booking, setBooking] = useState<Booking | null>(() => customerSeed)
  const [hostRequests, setHostRequests] = useState<HostRequest[]>(
    () => hostSeed?.pendingRequests ?? [],
  )
  const [activeLoads, setActiveLoads] = useState<Booking[]>(
    () => hostSeed?.activeLoads ?? [],
  )
  const [hostStats, setHostStats] = useState({
    loadsToday: hostSeed?.loadsToday ?? 0,
    maxLoads: hostSeed?.maxLoads ?? 4,
    accepting: hostSeed?.accepting ?? true,
  })
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    setScreen(defaultScreen(role))
    if (role === 'host') {
      const seed = getHostDashboardSeed(user!.id)
      setHostRequests(seed.pendingRequests)
      setActiveLoads(seed.activeLoads)
      setHostStats({
        loadsToday: seed.loadsToday,
        maxLoads: seed.maxLoads,
        accepting: seed.accepting,
      })
    } else {
      setBooking(getCustomerSeedBooking(user!.id))
    }
  }, [role, user!.id])

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
        customerId: user.id,
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

  const acceptRequest = useCallback(
    (requestId: string) => {
      const request = hostRequests.find((r) => r.id === requestId)
      if (!request || !user) return

      const hostProfile = getHostByUserId(user.id)
      const load: Booking = {
        id: `load-${Date.now()}`,
        hostId: hostProfile?.id ?? 'unknown',
        hostName: hostProfile?.name ?? user.name,
        customerId: request.customerId,
        customerName: request.customerName,
        location: request.location,
        loads: request.loads,
        dropOffTime: request.dropOffTime,
        sheetsOption: request.sheetsOption,
        notes: '',
        stage: 'got-bag',
        address: hostProfile?.address ?? '',
        gateCode: hostProfile?.gateCode ?? '',
        stageTimes: { 'got-bag': nowTime() },
      }
      setActiveLoads((prev) => [...prev, load])
      setHostRequests((prev) => prev.filter((r) => r.id !== requestId))
      setHostStats((prev) => ({ ...prev, loadsToday: prev.loadsToday + 1 }))
    },
    [hostRequests, user],
  )

  const declineRequest = useCallback((requestId: string) => {
    setHostRequests((prev) => prev.filter((r) => r.id !== requestId))
  }, [])

  const advanceStage = useCallback((loadId: string, stage: BookingStage) => {
    const time = nowTime()
    setActiveLoads((prev) =>
      prev.map((load) =>
        load.id === loadId
          ? { ...load, stage, stageTimes: { ...load.stageTimes, [stage]: time } }
          : load,
      ),
    )
    setBooking((prev) =>
      prev?.id === loadId
        ? { ...prev, stage, stageTimes: { ...prev.stageTimes, [stage]: time } }
        : prev,
    )
  }, [])

  const markDry = useCallback(
    (loadId: string) => {
      advanceStage(loadId, 'ready')
      setScreen('host-dashboard')
    },
    [advanceStage],
  )

  const value = useMemo(
    () => ({
      screen,
      selectedHost,
      booking,
      hostRequests,
      activeLoads,
      hostStats,
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
      hostRequests,
      activeLoads,
      hostStats,
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
