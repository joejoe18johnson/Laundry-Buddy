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
  getHostById,
  getHostDashboardSeed,
  getAvailableHosts,
  SEED_USERS,
} from '../data/mockData'
import { calculateBookingTotal, applyHostPricing, getHostPricing } from '../lib/hostPricing'
import { formatMoney } from '../lib/bookingPayments'
import { applyHostSettings } from '../lib/hostListing'
import {
  saveCompletedCustomerPayment,
  saveCompletedHostPayment,
} from '../lib/paymentHistoryStorage'
import {
  appendHostRequest,
  getHostOrders,
  mergeActiveLoads,
  mergeHostRequests,
  saveHostOrders,
} from '../lib/hostOrdersStorage'
import {
  DEFAULT_HOST_SETTINGS,
  getAllHostSettings,
  isHostOnline,
  saveHostSettings,
} from '../lib/hostSettingsStorage'
import {
  formatDropOffHour,
  type DropOffHour,
} from '../lib/dropOffAvailability'
import {
  type Booking,
  type BookingStage,
  type Host,
  type HostRequest,
  type HostSettings,
  type PaymentMethod,
  type Screen,
  type SheetsOption,
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
    dropOffTime: DropOffHour
    loads: number
    sheetsOption: SheetsOption
    notes: string
    paymentMethod: PaymentMethod
    foldingService: boolean
  }) => void
  acceptRequest: (requestId: string) => void
  declineRequest: (requestId: string) => void
  advanceStage: (loadId: string, stage: BookingStage) => void
  markDry: (loadId: string) => void
  confirmTransferPayment: (loadId: string) => void
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
      getHostOrders(user!.id).then((stored) => {
        setHostRequests(mergeHostRequests(seed.pendingRequests, stored.pendingRequests))
        setActiveLoads(mergeActiveLoads(seed.activeLoads, stored.activeLoads))
        setHostStats({
          loadsToday: seed.loadsToday,
          maxLoads: seed.maxLoads,
          accepting: seed.accepting,
        })
      })
    } else {
      setBooking(getCustomerSeedBooking(user!.id))
    }
  }, [role, user!.id])

  useEffect(() => {
    if (role === 'host') {
      setHostSettings(hostSettingsMap[user!.id] ?? { ...DEFAULT_HOST_SETTINGS })
    }
  }, [role, user!.id, hostSettingsMap])

  const onlineHosts = useMemo(
    () =>
      getAvailableHosts()
        .filter((h) => isHostOnline(h.hostUserId, hostSettingsMap))
        .map((h) =>
          applyHostSettings(h, h.hostUserId ? hostSettingsMap[h.hostUserId] : undefined),
        ),
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
      const wasOnline = hostSettingsMap[user.id]?.isOnline ?? false
      await saveHostSettings(user.id, settings)
      setHostSettings(settings)
      setHostSettingsMap((prev) => ({ ...prev, [user.id]: settings }))

      if (!wasOnline && settings.isOnline && settings.notifyGuestsWhenOnline) {
        const hostProfile = getHostByUserId(user.id)
        if (hostProfile) {
          const customers = SEED_USERS.filter((u) => u.role === 'customer')
          await Promise.all(
            customers.map((c) =>
              push(
                c.id,
                `${hostProfile.name} is online`,
                `${hostProfile.name} is accepting loads in ${hostProfile.location}. Book now while slots last.`,
              ),
            ),
          )
        }
      }
    },
    [role, user, hostSettingsMap, push],
  )

  const navigate = useCallback((next: Screen) => setScreen(next), [])

  const viewHostProfile = useCallback(
    (host: Host) => {
      const resolved = applyHostSettings(
        host,
        host.hostUserId ? hostSettingsMap[host.hostUserId] : undefined,
      )
      setSelectedHost(resolved)
      setScreen('customer-host-profile')
    },
    [hostSettingsMap],
  )

  const selectHost = useCallback(
    (host: Host) => {
      const resolved = applyHostSettings(
        host,
        host.hostUserId ? hostSettingsMap[host.hostUserId] : undefined,
      )
      setSelectedHost(resolved)
      setScreen('customer-booking')
    },
    [hostSettingsMap],
  )

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
      dropOffTime: DropOffHour
      loads: number
      sheetsOption: SheetsOption
      notes: string
      paymentMethod: PaymentMethod
      foldingService: boolean
    }) => {
      if (!selectedHost || !user) return
      const settings = getSettingsForHost(selectedHost.hostUserId)
      const pricing = getHostPricing(selectedHost, settings)
      const totalAmount = calculateBookingTotal({
        loads: details.loads,
        dryPrice: pricing.dryPrice,
        foldingPrice: pricing.foldingPrice,
        sheetsPrice: pricing.sheetsPrice,
        sheetsOption: details.sheetsOption,
        foldingService: details.foldingService,
      })
      const bookingId = `bk-${Date.now()}`
      const newBooking: Booking = {
        id: bookingId,
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
        pricePerLoad: pricing.dryPrice,
        dryPrice: pricing.dryPrice,
        foldingPrice: pricing.foldingPrice,
        sheetsPrice: pricing.sheetsPrice,
        foldingService: details.foldingService,
        totalAmount,
        paymentStatus: totalAmount <= 0 ? 'paid' : 'pending',
        stage: 'got-bag',
        address: selectedHost.address,
        gateCode: selectedHost.gateCode,
        stageTimes: { 'got-bag': nowTime() },
        isNew: true,
      }
      setBooking(newBooking)
      setScreen('customer-tracking')

      if (selectedHost.hostUserId) {
        const hostRequest: HostRequest = {
          id: bookingId,
          customerId: user.id,
          customerName: user.name,
          location: selectedHost.location,
          loads: details.loads,
          dropOffTime: details.dropOffTime,
          sheetsOption: details.sheetsOption,
          notes: details.notes,
          paymentMethod: details.paymentMethod,
          foldingService: details.foldingService,
          totalAmount,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }
        void appendHostRequest(selectedHost.hostUserId, hostRequest)
      }

      notifyHost(
        selectedHost.hostUserId,
        'New booking',
        `${user.name} · ${formatDropOffHour(details.dropOffTime)}${details.notes.trim() ? ` · "${details.notes.trim()}"` : ''}`,
      )
      notifyCustomer(
        user.id,
        'Booking confirmed',
        `${selectedHost.name} will expect your laundry during your drop-off window.`,
      )
    },
    [selectedHost, user, notifyHost, notifyCustomer, getSettingsForHost],
  )

  const acceptRequest = useCallback(
    (requestId: string) => {
      const request = hostRequests.find((r) => r.id === requestId)
      if (!request || !user) return

      const settings = getSettingsForHost(user.id)
      const hostRaw = getHostByUserId(user.id)
      const hostProfile = hostRaw ? applyHostSettings(hostRaw, settings) : undefined
      const pricing = hostProfile
        ? getHostPricing(hostProfile, settings)
        : { dryPrice: 0, foldingPrice: 0, sheetsPrice: 1 }

      const load: Booking = {
        id: request.id.startsWith('req-') ? `load-${Date.now()}` : request.id,
        hostId: hostProfile?.id ?? 'unknown',
        hostName: hostProfile?.name ?? user.name,
        customerId: request.customerId,
        customerName: request.customerName,
        location: request.location,
        loads: request.loads,
        dropOffTime: request.dropOffTime,
        sheetsOption: request.sheetsOption,
        notes: request.notes ?? '',
        paymentMethod: request.paymentMethod,
        foldingService: request.foldingService,
        totalAmount: request.totalAmount,
        pricePerLoad: pricing.dryPrice,
        dryPrice: pricing.dryPrice,
        foldingPrice: pricing.foldingPrice,
        sheetsPrice: pricing.sheetsPrice,
        paymentStatus:
          (request.totalAmount ?? 0) <= 0 || request.paymentMethod === 'cash' ? 'paid' : 'pending',
        stage: 'got-bag',
        address: hostProfile?.address ?? '',
        gateCode: hostProfile?.gateCode ?? '',
        stageTimes: { 'got-bag': nowTime() },
      }

      const nextRequests = hostRequests.filter((r) => r.id !== requestId)
      const nextLoads = [...activeLoads, load]
      setActiveLoads(nextLoads)
      setHostRequests(nextRequests)
      setHostStats((prev) => ({ ...prev, loadsToday: prev.loadsToday + 1 }))
      void saveHostOrders(user.id, { pendingRequests: nextRequests, activeLoads: nextLoads })

      setBooking((prev) => (prev?.id === request.id ? { ...prev, ...load } : prev))

      if (request.customerId) {
        notifyCustomer(
          request.customerId,
          'Request accepted',
          `${hostProfile?.name ?? user.name} accepted your load request.`,
        )
      }
    },
    [hostRequests, activeLoads, user, notifyCustomer, getSettingsForHost],
  )

  const declineRequest = useCallback(
    (requestId: string) => {
      const request = hostRequests.find((r) => r.id === requestId)
      const nextRequests = hostRequests.filter((r) => r.id !== requestId)
      setHostRequests(nextRequests)
      if (user) {
        void saveHostOrders(user.id, { pendingRequests: nextRequests, activeLoads })
      }
      if (request?.customerId) {
        notifyCustomer(
          request.customerId,
          'Request declined',
          'The host could not take your load this time. Try another nearby host.',
        )
      }
    },
    [hostRequests, activeLoads, user, notifyCustomer],
  )

  const advanceStage = useCallback(
    (loadId: string, stage: BookingStage) => {
      const time = nowTime()
      const completedDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })

      const patchLoad = (load: Booking): Booking => ({
        ...load,
        stage,
        stageTimes: { ...load.stageTimes, [stage]: time },
        ...(stage === 'ready'
          ? { completedAt: completedDate, paymentStatus: 'paid' as const }
          : {}),
      })

      const persistIfReady = (load: Booking) => {
        if (stage !== 'ready') return
        const completed = patchLoad(load)
        if (completed.customerId) {
          saveCompletedCustomerPayment(completed.customerId, completed)
        }
        const host = getHostById(completed.hostId)
        if (host?.hostUserId) {
          saveCompletedHostPayment(host.hostUserId, completed)
        }
      }

      let notifyTarget: Booking | undefined

      setActiveLoads((prev) => {
        const next = prev.map((load) => {
          if (load.id !== loadId) return load
          notifyTarget = load
          persistIfReady(load)
          return patchLoad(load)
        })
        if (role === 'host' && user) {
          void saveHostOrders(user.id, { pendingRequests: hostRequests, activeLoads: next })
        }
        return next
      })

      setBooking((prev) => {
        if (prev?.id !== loadId) return prev
        notifyTarget = prev
        persistIfReady(prev)
        return patchLoad(prev)
      })

      if (notifyTarget?.customerId) {
        notifyCustomer(
          notifyTarget.customerId,
          STAGE_LABELS[stage],
          `${notifyTarget.hostName} updated your load — ${STAGE_LABELS[stage].toLowerCase()}.`,
        )
      }
    },
    [notifyCustomer, role, user, hostRequests],
  )

  const markDry = useCallback(
    (loadId: string) => {
      advanceStage(loadId, 'ready')
      setScreen('host-dashboard')
    },
    [advanceStage],
  )

  const confirmTransferPayment = useCallback(
    (loadId: string) => {
      const markPaid = (load: Booking): Booking => ({ ...load, paymentStatus: 'paid' })

      let target: Booking | undefined

      setActiveLoads((prev) => {
        const next = prev.map((load) => {
          if (load.id !== loadId) return load
          target = load
          return markPaid(load)
        })
        if (role === 'host' && user) {
          void saveHostOrders(user.id, { pendingRequests: hostRequests, activeLoads: next })
        }
        return next
      })

      setBooking((prev) => {
        if (prev?.id !== loadId) return prev
        target = prev
        return markPaid(prev)
      })

      if (target?.customerId) {
        notifyCustomer(
          target.customerId,
          'Payment verified',
          `${target.hostName} confirmed your bank transfer of ${formatMoney(target.totalAmount ?? 0)}.`,
        )
      }
    },
    [notifyCustomer, role, user, hostRequests],
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
      confirmTransferPayment,
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
      confirmTransferPayment,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
