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
import { useNotifications } from './NotificationContext'
import {
  getCustomerSeedBooking,
  getHostByUserId,
  getHostDashboardSeed,
  getAvailableHosts,
} from '../data/mockData'
import {
  DEFAULT_HOST_SETTINGS,
  getAllHostSettings,
  isHostOnline,
  saveHostSettings,
} from '../lib/hostSettingsStorage'
import type {
  Booking,
  BookingStage,
  DropOffTime,
  Host,
  HostRequest,
  HostSettings,
  PaymentMethod,
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
  hostSettings: HostSettings | null
  hostSettingsMap: Record<string, HostSettings>
  onlineHosts: Host[]
  showMap: boolean
  navigate: (screen: Screen) => void
  viewHostProfile: (host: Host) => void
  selectHost: (host: Host) => void
  setShowMap: (show: boolean) => void
  getSettingsForHost: (hostUserId?: string) => HostSettings
  updateHostSettings: (settings: HostSettings) => Promise<void>
  confirmBooking: (details: {
    dropOffTime: DropOffTime
    loads: number
    sheetsOption: SheetsOption
    notes: string
    paymentMethod: PaymentMethod
  }) => void
  acceptRequest: (requestId: string) => void
  declineRequest: (requestId: string) => void
  advanceStage: (loadId: string, stage: BookingStage) => void
  markDry: (loadId: string) => void
}

const AppContext = createContext<AppState | null>(null)

const STAGE_LABELS: Record<BookingStage, string> = {
  'got-bag': 'Bag received',
  waiting: 'Waiting for dryer',
  drying: 'Drying',
  ready: 'Ready for pickup',
}

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
  const { push } = useNotifications()
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
  const [hostSettingsMap, setHostSettingsMap] = useState<Record<string, HostSettings>>({})
  const [hostSettings, setHostSettings] = useState<HostSettings | null>(null)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    getAllHostSettings().then((map) => {
      setHostSettingsMap(map)
      if (role === 'host') {
        setHostSettings(map[user!.id] ?? { ...DEFAULT_HOST_SETTINGS })
      }
    })
  }, [role, user!.id])

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
      setHostSettings(hostSettingsMap[user!.id] ?? { ...DEFAULT_HOST_SETTINGS })
    } else {
      setBooking(getCustomerSeedBooking(user!.id))
    }
  }, [role, user!.id, hostSettingsMap])

  const onlineHosts = useMemo(
    () =>
      getAvailableHosts().filter((h) => isHostOnline(h.hostUserId, hostSettingsMap)),
    [hostSettingsMap],
  )

  const getSettingsForHost = useCallback(
    (hostUserId?: string) => {
      if (!hostUserId) return { ...DEFAULT_HOST_SETTINGS }
      return hostSettingsMap[hostUserId] ?? { ...DEFAULT_HOST_SETTINGS }
    },
    [hostSettingsMap],
  )

  const updateHostSettings = useCallback(
    async (settings: HostSettings) => {
      if (role !== 'host' || !user) return
      await saveHostSettings(user.id, settings)
      setHostSettings(settings)
      setHostSettingsMap((prev) => ({ ...prev, [user.id]: settings }))
    },
    [role, user],
  )

  const navigate = useCallback((next: Screen) => setScreen(next), [])

  const viewHostProfile = useCallback((host: Host) => {
    setSelectedHost(host)
    setScreen('customer-host-profile')
  }, [])

  const selectHost = useCallback((host: Host) => {
    setSelectedHost(host)
    setScreen('customer-booking')
  }, [])

  const notifyHost = useCallback(
    async (hostUserId: string | undefined, title: string, body: string) => {
      if (!hostUserId) return
      const settings = hostSettingsMap[hostUserId]
      if (settings?.notifyNewRequests !== false) {
        await push(hostUserId, title, body)
      }
    },
    [hostSettingsMap, push],
  )

  const notifyCustomer = useCallback(
    async (customerId: string | undefined, title: string, body: string) => {
      if (!customerId) return
      await push(customerId, title, body)
    },
    [push],
  )

  const confirmBooking = useCallback(
    (details: {
      dropOffTime: DropOffTime
      loads: number
      sheetsOption: SheetsOption
      notes: string
      paymentMethod: PaymentMethod
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
        paymentMethod: details.paymentMethod,
        stage: 'got-bag',
        address: selectedHost.address,
        gateCode: selectedHost.gateCode,
        stageTimes: { 'got-bag': nowTime() },
        isNew: true,
      }
      setBooking(newBooking)
      setScreen('customer-tracking')

      notifyHost(
        selectedHost.hostUserId,
        'New booking',
        `${user.name} booked ${details.loads} load${details.loads > 1 ? 's' : ''} · ${details.paymentMethod === 'cash' ? 'Cash' : 'Bank transfer'}`,
      )
      notifyCustomer(
        user.id,
        'Booking confirmed',
        `${selectedHost.name} will expect your laundry during your drop-off window.`,
      )
    },
    [selectedHost, user, notifyHost, notifyCustomer],
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

      if (request.customerId) {
        notifyCustomer(
          request.customerId,
          'Request accepted',
          `${hostProfile?.name ?? user.name} accepted your load request.`,
        )
      }
    },
    [hostRequests, user, notifyCustomer],
  )

  const declineRequest = useCallback(
    (requestId: string) => {
      const request = hostRequests.find((r) => r.id === requestId)
      setHostRequests((prev) => prev.filter((r) => r.id !== requestId))
      if (request?.customerId) {
        notifyCustomer(
          request.customerId,
          'Request declined',
          'The host could not take your load this time. Try another nearby host.',
        )
      }
    },
    [hostRequests, notifyCustomer],
  )

  const advanceStage = useCallback(
    (loadId: string, stage: BookingStage) => {
      const time = nowTime()
      let customerId: string | undefined
      let hostName = ''

      setActiveLoads((prev) =>
        prev.map((load) => {
          if (load.id === loadId) {
            customerId = load.customerId
            hostName = load.hostName
            return { ...load, stage, stageTimes: { ...load.stageTimes, [stage]: time } }
          }
          return load
        }),
      )
      setBooking((prev) =>
        prev?.id === loadId
          ? { ...prev, stage, stageTimes: { ...prev.stageTimes, [stage]: time } }
          : prev,
      )

      if (customerId) {
        notifyCustomer(
          customerId,
          STAGE_LABELS[stage],
          `${hostName} updated your load — ${STAGE_LABELS[stage].toLowerCase()}.`,
        )
      }
    },
    [notifyCustomer],
  )

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
      hostSettings,
      hostSettingsMap,
      onlineHosts,
      showMap,
      navigate,
      viewHostProfile,
      selectHost,
      setShowMap,
      getSettingsForHost,
      updateHostSettings,
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
      hostSettings,
      hostSettingsMap,
      onlineHosts,
      showMap,
      navigate,
      viewHostProfile,
      selectHost,
      getSettingsForHost,
      updateHostSettings,
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
