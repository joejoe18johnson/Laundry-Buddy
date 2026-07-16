import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { useNotifications } from './NotificationContext'
import { useToast } from './ToastContext'
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
import { resolveGuestFacingHostSettings } from '../lib/defaultHostSettings'
import { scheduleDropOffReminder } from '../lib/pushNotifications'
import { formatClothesListSummary, hasDelicates } from '../lib/clothesList'
import {
  saveCompletedCustomerPayment,
  saveCompletedHostPayment,
  loadCustomerPaymentHistory,
} from '../lib/paymentHistoryStorage'
import { loadActiveBooking, saveActiveBooking } from '../lib/bookingStorage'
import {
  bookingTrackingLink,
  hostDashboardLink,
  hostReviewLink,
  linkFromPushData,
  resolveNotificationLink,
} from '../lib/notificationLinks'
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
  enrichHostsWithDistance,
  filterHostsWithinRadius,
  type Coordinates,
} from '../lib/geo'
import { USER_LOCATION } from '../lib/mapRegion'
import {
  loadLocationPreferences,
  saveLocationPreferences,
  type LocationPreferences,
  type RadiusOptionKm,
} from '../lib/locationPreferences'
import { FILTER_AREA_RADIUS_KM, getFilterAreaCenter } from '../lib/belizeDistricts'
import * as Location from 'expo-location'
import { formatDropOffHour, type DropOffHour } from '../lib/dropOffAvailability'
import {
  type Booking,
  type BookingStage,
  type Host,
  type HostRequest,
  type HostSettings,
  type ClothesListItem,
  type PaymentMethod,
  type Screen,
  type SheetsOption,
  type AppNotification,
  type NotificationLink,
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
  allOnlineHosts: Host[]
  userLocation: Coordinates
  userLocationLabel: string
  locationLoading: boolean
  searchRadiusKm: number
  requestUserLocation: () => Promise<void>
  fetchGpsLocation: () => Promise<Coordinates | null>
  applyLocationPreferences: (prefs: LocationPreferences) => void
  setLocationPreset: (label: string, latitude: number, longitude: number) => void
  focusSearchOnArea: (area: string) => void
  setSearchRadiusKm: (km: RadiusOptionKm) => void
  showMap: boolean
  refreshHostData: () => Promise<void>
  navigate: (screen: Screen) => void
  viewHostProfile: (host: Host, options?: { reviewPrompt?: boolean }) => void
  selectHost: (host: Host) => void
  setShowMap: (show: boolean) => void
  getSettingsForHost: (hostUserId?: string) => HostSettings
  updateHostSettings: (settings: HostSettings) => Promise<void>
  confirmBooking: (details: {
    dropOffTime: DropOffHour
    loads: number
    sheetsOption: SheetsOption
    notes: string
    clothesList: ClothesListItem[]
    paymentMethod: PaymentMethod
    foldingService: boolean
    loadPhotoUri?: string
  }) => void
  acceptRequest: (requestId: string) => void
  declineRequest: (requestId: string) => void
  advanceStage: (loadId: string, stage: BookingStage) => void
  markDry: (loadId: string) => void
  confirmPickup: (loadId: string) => void
  confirmTransferPayment: (loadId: string) => void
  openNotification: (notification: AppNotification) => Promise<void>
  openNotificationFromPush: (title: string, data: Record<string, unknown>) => Promise<void>
  reviewProfilePrompt: boolean
  clearReviewProfilePrompt: () => void
}

const AppContext = createContext<AppState | null>(null)

const STAGE_LABELS: Record<BookingStage, string> = {
  'got-bag': 'Bag received',
  waiting: 'Waiting for dryer',
  drying: 'Drying',
  ready: 'Ready for pickup',
  'picked-up': 'Picked up',
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
  const { showToast } = useToast()
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
  const [userLocation, setUserLocation] = useState<Coordinates>(USER_LOCATION)
  const [userLocationLabel, setUserLocationLabel] = useState('San Ignacio')
  const [locationLoading, setLocationLoading] = useState(false)
  const [searchRadiusKm, setSearchRadiusKmState] = useState(10)
  const [reviewProfilePrompt, setReviewProfilePrompt] = useState(false)

  const bookingRef = useRef(booking)
  const activeLoadsRef = useRef(activeLoads)
  bookingRef.current = booking
  activeLoadsRef.current = activeLoads

  useEffect(() => {
    loadLocationPreferences().then((prefs) => {
      setUserLocation(prefs.userLocation)
      setUserLocationLabel(prefs.userLocationLabel)
      setSearchRadiusKmState(prefs.searchRadiusKm)
    })
  }, [])

  const persistLocationPrefs = useCallback(
    (location: Coordinates, label: string, radiusKm: number) => {
      void saveLocationPreferences({ userLocation: location, userLocationLabel: label, searchRadiusKm: radiusKm })
    },
    [],
  )

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
      void loadActiveBooking(user!.id).then((stored) => {
        setBooking(stored ?? getCustomerSeedBooking(user!.id))
      })
    }
  }, [role, user!.id])

  useEffect(() => {
    if (role === 'customer' && user) {
      void saveActiveBooking(user.id, booking)
    }
  }, [booking, role, user])

  useEffect(() => {
    if (role === 'host') {
      setHostSettings(hostSettingsMap[user!.id] ?? { ...DEFAULT_HOST_SETTINGS })
    }
  }, [role, user!.id, hostSettingsMap])

  const allOnlineHosts = useMemo(() => {
    const available = getAvailableHosts()
      .filter((h) => isHostOnline(h.hostUserId, hostSettingsMap))
      .map((h) =>
        applyHostSettings(h, h.hostUserId ? hostSettingsMap[h.hostUserId] : undefined),
      )
    return enrichHostsWithDistance(available, userLocation)
  }, [hostSettingsMap, userLocation])

  const onlineHosts = useMemo(
    () => filterHostsWithinRadius(allOnlineHosts, userLocation, searchRadiusKm),
    [allOnlineHosts, userLocation, searchRadiusKm],
  )

  const setLocationPreset = useCallback(
    (label: string, latitude: number, longitude: number) => {
      const coords = { latitude, longitude }
      setUserLocation(coords)
      setUserLocationLabel(label)
      persistLocationPrefs(coords, label, searchRadiusKm)
      showToast('Search area saved', { icon: 'check' })
    },
    [persistLocationPrefs, searchRadiusKm, showToast],
  )

  const applyLocationPreferences = useCallback(
    (prefs: LocationPreferences) => {
      const km = prefs.searchRadiusKm as RadiusOptionKm
      setUserLocation(prefs.userLocation)
      setUserLocationLabel(prefs.userLocationLabel)
      setSearchRadiusKmState(km)
      persistLocationPrefs(prefs.userLocation, prefs.userLocationLabel, km)
      showToast('Search area saved', { icon: 'check' })
    },
    [persistLocationPrefs, showToast],
  )

  const focusSearchOnArea = useCallback(
    (area: string) => {
      const center = getFilterAreaCenter(area)
      if (!center) return
      applyLocationPreferences({
        userLocation: { latitude: center.latitude, longitude: center.longitude },
        userLocationLabel: center.label,
        searchRadiusKm: FILTER_AREA_RADIUS_KM as RadiusOptionKm,
      })
    },
    [applyLocationPreferences],
  )

  const setSearchRadiusKm = useCallback(
    (km: RadiusOptionKm) => {
      applyLocationPreferences({
        userLocation,
        userLocationLabel,
        searchRadiusKm: km,
      })
    },
    [applyLocationPreferences, userLocation, userLocationLabel],
  )

  const fetchGpsLocation = useCallback(async (): Promise<Coordinates | null> => {
    setLocationLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        showToast('Location permission denied', { icon: 'map-pin' })
        return null
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
    } catch {
      showToast('Could not get your location', { icon: 'map-pin' })
      return null
    } finally {
      setLocationLoading(false)
    }
  }, [showToast])

  const requestUserLocation = useCallback(async () => {
    const coords = await fetchGpsLocation()
    if (!coords) return
    applyLocationPreferences({
      userLocation: coords,
      userLocationLabel: 'Your location',
      searchRadiusKm,
    })
  }, [applyLocationPreferences, fetchGpsLocation, searchRadiusKm])

  const getSettingsForHost = useCallback(
    (hostUserId?: string) => {
      const host = hostUserId ? getHostByUserId(hostUserId) : undefined
      return resolveGuestFacingHostSettings(hostUserId, hostSettingsMap, host)
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
      showToast('Settings saved', { icon: 'check' })

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
    [role, user, hostSettingsMap, push, showToast],
  )

  const refreshHostData = useCallback(async () => {
    const map = await getAllHostSettings()
    setHostSettingsMap(map)
    if (role === 'host' && user) {
      setHostSettings(map[user.id] ?? { ...DEFAULT_HOST_SETTINGS })
    }
  }, [role, user])

  const navigate = useCallback((next: Screen) => setScreen(next), [])

  const viewHostProfile = useCallback(
    (host: Host, options?: { reviewPrompt?: boolean }) => {
      const resolved = applyHostSettings(
        host,
        host.hostUserId ? hostSettingsMap[host.hostUserId] : undefined,
      )
      setSelectedHost(resolved)
      setReviewProfilePrompt(options?.reviewPrompt ?? false)
      setScreen('customer-host-profile')
    },
    [hostSettingsMap],
  )

  const clearReviewProfilePrompt = useCallback(() => {
    setReviewProfilePrompt(false)
  }, [])

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
    async (hostUserId: string | undefined, title: string, body: string, link?: NotificationLink) => {
      if (!hostUserId) return
      const settings = hostSettingsMap[hostUserId]
      if (settings?.notifyNewRequests !== false) {
        await push(hostUserId, title, body, link)
      }
    },
    [hostSettingsMap, push],
  )

  const notifyCustomer = useCallback(
    async (customerId: string | undefined, title: string, body: string, link?: NotificationLink) => {
      if (!customerId) return
      await push(customerId, title, body, link)
    },
    [push],
  )

  const restoreBookingForGuest = useCallback(
    async (bookingId?: string): Promise<Booking | null> => {
      const current = bookingRef.current
      if (bookingId && current?.id === bookingId) return current
      if (!bookingId && current) return current
      if (current && current.customerId === user?.id && current.requestStatus !== 'declined') {
        return current
      }

      if (!user) return null

      const stored = await loadActiveBooking(user.id)
      if (stored && (!bookingId || stored.id === bookingId)) return stored

      const history = await loadCustomerPaymentHistory(user.id)
      const fromHistory = bookingId
        ? history.find((entry) => entry.id === bookingId)
        : history[0]
      if (fromHistory) return fromHistory

      const seed = getCustomerSeedBooking(user.id)
      if (seed && (!bookingId || seed.id === bookingId)) return seed

      return null
    },
    [user],
  )

  const openNotification = useCallback(
    async (notification: AppNotification) => {
      const link = resolveNotificationLink(notification, role)
      if (!link) {
        setScreen('notifications')
        return
      }

      if (link.screen === 'customer-tracking') {
        const restored = await restoreBookingForGuest(link.bookingId || undefined)
        if (restored) setBooking(restored)
        setScreen('customer-tracking')
        return
      }

      if (link.screen === 'customer-host-profile') {
        const host = getHostById(link.hostId)
        if (host) {
          viewHostProfile(host, { reviewPrompt: true })
          return
        }
        showToast('Host profile unavailable', { icon: 'info' })
        setScreen('customer-home')
        return
      }

      if (link.screen === 'host-dashboard') {
        setScreen('host-dashboard')
        return
      }

      if (link.screen === 'history') {
        setScreen('history')
        return
      }

      setScreen('customer-home')
    },
    [restoreBookingForGuest, role, showToast, viewHostProfile],
  )

  const openNotificationFromPush = useCallback(
    async (title: string, data: Record<string, unknown>) => {
      const link = linkFromPushData(data) ?? resolveNotificationLink({ title } as AppNotification, role)
      if (!link) {
        setScreen('notifications')
        return
      }
      await openNotification({ id: '', userId: user!.id, title, body: '', time: '', read: true, link })
    },
    [openNotification, role, user],
  )

  const confirmBooking = useCallback(
    (details: {
      dropOffTime: DropOffHour
      loads: number
      sheetsOption: SheetsOption
      notes: string
      clothesList: ClothesListItem[]
      paymentMethod: PaymentMethod
      foldingService: boolean
      loadPhotoUri?: string
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
        requestStatus: 'pending',
        loadPhotoUri: details.loadPhotoUri,
        clothesList: details.clothesList.length > 0 ? details.clothesList : undefined,
        stage: 'got-bag',
        address: '',
        gateCode: '',
        stageTimes: {},
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
          loadPhotoUri: details.loadPhotoUri,
          clothesList: details.clothesList.length > 0 ? details.clothesList : undefined,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }
        void appendHostRequest(selectedHost.hostUserId, hostRequest)
      }

      const clothesSummary = formatClothesListSummary(details.clothesList)
      const delicateNote = hasDelicates(details.clothesList) ? ' · Delicates included' : ''

      notifyHost(
        selectedHost.hostUserId,
        'New booking',
        `${user.name} · ${formatDropOffHour(details.dropOffTime)}${clothesSummary ? ` · ${clothesSummary}` : ''}${details.notes.trim() ? ` · "${details.notes.trim()}"` : ''}${delicateNote}${details.loadPhotoUri ? ' · Photo attached' : ''}`,
        hostDashboardLink(bookingId),
      )
      notifyCustomer(
        user.id,
        'Request sent',
        `${selectedHost.name} will review your load request. We'll notify you when they accept.`,
        bookingTrackingLink(bookingId),
      )
      showToast('Request sent to host', { icon: 'send' })
    },
    [selectedHost, user, notifyHost, notifyCustomer, getSettingsForHost, showToast],
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
        loadPhotoUri: request.loadPhotoUri,
        clothesList: request.clothesList,
        pricePerLoad: pricing.dryPrice,
        dryPrice: pricing.dryPrice,
        foldingPrice: pricing.foldingPrice,
        sheetsPrice: pricing.sheetsPrice,
        paymentStatus:
          (request.totalAmount ?? 0) <= 0 || request.paymentMethod === 'cash' ? 'paid' : 'pending',
        requestStatus: 'accepted',
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

      setBooking((prev) =>
        prev?.id === request.id ? { ...prev, ...load, requestStatus: 'accepted', isNew: false } : prev,
      )

      if (request.customerId) {
        const hostName = hostProfile?.name ?? user.name
        const bank = settings.bankDetails
        const needsTransfer =
          request.paymentMethod === 'bank_transfer' && (request.totalAmount ?? 0) > 0
        const body = needsTransfer
          ? `${hostName} accepted your load! Transfer ${formatMoney(request.totalAmount ?? 0)} to ${bank.bankName} · ${bank.accountNumber}, then send proof on WhatsApp. Open the app for drop-off directions.`
          : `${hostName} accepted your load! Open the app for drop-off directions and gate details.`
        notifyCustomer(request.customerId, 'Load accepted', body, bookingTrackingLink(load.id))
        void scheduleDropOffReminder(load.id, hostName, request.dropOffTime)
        showToast('Guest notified', { icon: 'check-circle' })
      }
    },
    [hostRequests, activeLoads, user, notifyCustomer, getSettingsForHost, showToast],
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
          bookingTrackingLink(requestId),
        )
      }
      setBooking((prev) =>
        prev?.id === requestId ? { ...prev, requestStatus: 'declined', isNew: false } : prev,
      )
      showToast('Request declined', { icon: 'x-circle' })
    },
    [hostRequests, activeLoads, user, notifyCustomer, showToast],
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
        ...(stage === 'picked-up'
          ? { completedAt: completedDate, paymentStatus: 'paid' as const }
          : {}),
      })

      const persistIfPickedUp = (load: Booking) => {
        if (stage !== 'picked-up') return
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
          persistIfPickedUp(load)
          return patchLoad(load)
        })
        if (role === 'host' && user) {
          void saveHostOrders(user.id, { pendingRequests: hostRequests, activeLoads: next })
        }
        return stage === 'picked-up' ? next.filter((load) => load.id !== loadId) : next
      })

      setBooking((prev) => {
        if (prev?.id !== loadId) return prev
        notifyTarget = prev
        persistIfPickedUp(prev)
        if (stage === 'picked-up') return null
        return patchLoad(prev)
      })

      if (notifyTarget?.customerId && stage !== 'picked-up') {
        notifyCustomer(
          notifyTarget.customerId,
          STAGE_LABELS[stage],
          `${notifyTarget.hostName} updated your load — ${STAGE_LABELS[stage].toLowerCase()}.`,
          bookingTrackingLink(notifyTarget.id),
        )
      }
    },
    [notifyCustomer, role, user, hostRequests],
  )

  const confirmPickup = useCallback(
    (loadId: string) => {
      const pickedUp =
        activeLoadsRef.current.find((load) => load.id === loadId) ??
        (bookingRef.current?.id === loadId ? bookingRef.current : undefined)

      advanceStage(loadId, 'picked-up')

      if (pickedUp?.customerId) {
        void notifyCustomer(
          pickedUp.customerId,
          'Leave A Review',
          `Thanks for picking up from ${pickedUp.hostName}! Leave a review to help others find great hosts.`,
          hostReviewLink(pickedUp.hostId),
        )
      }

      const host = pickedUp ? getHostById(pickedUp.hostId) : undefined
      if (host?.hostUserId && pickedUp) {
        void notifyHost(
          host.hostUserId,
          'Ask For A Review',
          `${pickedUp.customerName} picked up their load. Ask them to leave a review on Laundry Buddy — it helps you get more bookings.`,
          hostDashboardLink(),
        )
      }

      if (role === 'host') {
        showToast('Pickup confirmed — ask your guest for a review', { icon: 'star' })
      } else {
        showToast('Thanks! Leave a review for your host', { icon: 'star' })
      }
    },
    [advanceStage, notifyCustomer, notifyHost, role, showToast],
  )

  const markDry = useCallback(
    (loadId: string) => {
      advanceStage(loadId, 'ready')
      showToast('Load marked dry — guest notified', { icon: 'check-circle' })
      setScreen('host-dashboard')
    },
    [advanceStage, showToast],
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
          bookingTrackingLink(target.id),
        )
        showToast('Payment marked received', { icon: 'check-circle' })
      }
    },
    [notifyCustomer, role, user, hostRequests, showToast],
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
      allOnlineHosts,
      userLocation,
      userLocationLabel,
      locationLoading,
      searchRadiusKm,
      requestUserLocation,
      fetchGpsLocation,
      applyLocationPreferences,
      setLocationPreset,
      focusSearchOnArea,
      setSearchRadiusKm,
      showMap,
      refreshHostData,
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
      confirmPickup,
      confirmTransferPayment,
      openNotification,
      openNotificationFromPush,
      reviewProfilePrompt,
      clearReviewProfilePrompt,
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
      allOnlineHosts,
      userLocation,
      userLocationLabel,
      locationLoading,
      searchRadiusKm,
      requestUserLocation,
      fetchGpsLocation,
      applyLocationPreferences,
      setLocationPreset,
      focusSearchOnArea,
      setSearchRadiusKm,
      showMap,
      refreshHostData,
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
      confirmPickup,
      confirmTransferPayment,
      openNotification,
      openNotificationFromPush,
      reviewProfilePrompt,
      clearReviewProfilePrompt,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
