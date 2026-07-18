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
import { calculateBookingTotal, applyHostPricing, getHostPricing, DRYER_SHEETS_PRICE } from '../lib/hostPricing'
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
import { loadActiveBookings, saveActiveBookings } from '../lib/bookingStorage'
import {
  filterActiveGuestBookings,
  findGuestBooking,
  isActiveGuestBooking,
  mergeGuestBookings,
  patchGuestBooking,
  removeGuestBooking,
  upsertGuestBooking,
} from '../lib/guestBookings'
import {
  loadStoredReviewsForHost,
  markBookingReviewed,
  mergeHostReviews,
  saveReviewForHost,
} from '../lib/reviewStorage'
import {
  bookingTrackingLink,
  hostDashboardLink,
  hostProfileLink,
  hostReviewLink,
  linkFromPushData,
  resolveNotificationLink,
} from '../lib/notificationLinks'
import {
  appendHostRequest,
  dedupeActiveLoads,
  getHostOrders,
  mergeActiveLoads,
  mergeHostRequests,
  removeHostActiveLoad,
  removeHostPendingRequest,
  saveHostOrders,
  upsertActiveLoad,
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
import { canGuestCancelPendingRequest } from '../lib/pendingRequestCancel'
import { supportThreadId } from '../lib/chatThreads'
import { syncTrainingDemoIfNeeded } from '../lib/trainingSeedStorage'
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
  type HostReview,
} from '../types'

interface AppState {
  screen: Screen
  selectedHost: Host | null
  booking: Booking | null
  guestBookings: Booking[]
  activeGuestBookings: Booking[]
  selectGuestBooking: (bookingId: string) => void
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
  viewHostProfile: (host: Host) => void
  openLeaveReview: (hostId: string, bookingId?: string) => void
  submitHostReview: (input: {
    hostId: string
    bookingId?: string | null
    rating: number
    comment: string
  }) => Promise<void>
  getReviewsForHost: (hostId: string) => HostReview[]
  refreshHostReviews: (hostId: string) => Promise<void>
  reviewHostId: string | null
  reviewBookingId: string | null
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
  cancelPendingRequest: (bookingId: string) => void
  clearBooking: () => void
  markBagReceived: (loadId: string) => void
  advanceStage: (loadId: string, stage: BookingStage, extras?: { dryPhotoUri?: string }) => void
  openMarkDry: (loadId: string) => void
  markDryLoadId: string | null
  markDry: (loadId: string, dryPhotoUri?: string) => void
  confirmPickup: (loadId: string) => void
  confirmTransferPayment: (loadId: string) => void
  markPaymentProofSent: (loadId: string) => void
  chatThreadId: string | null
  chatBooking: Booking | null
  openChat: (threadId: string, bookingId?: string) => void
  openSupportChat: () => void
  findBookingForChat: (bookingId: string) => Booking | null
  closeChat: () => void
  openNotification: (notification: AppNotification) => Promise<void>
  openNotificationFromPush: (title: string, data: Record<string, unknown>) => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

const STAGE_LABELS: Record<BookingStage, string> = {
  'got-bag': 'Payment confirmed',
  waiting: 'Payment confirmed',
  drying: 'Drying started',
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
  const customerSeedBookings =
    role === 'customer'
      ? filterActiveGuestBookings(
          [getCustomerSeedBooking(user!.id)].filter((entry): entry is Booking => !!entry),
        )
      : []

  const [screen, setScreen] = useState<Screen>(() => defaultScreen(role))
  const [selectedHost, setSelectedHost] = useState<Host | null>(null)
  const [guestBookings, setGuestBookings] = useState<Booking[]>(() => customerSeedBookings)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    () => customerSeedBookings[0]?.id ?? null,
  )
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
  const [reviewHostId, setReviewHostId] = useState<string | null>(null)
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null)
  const [hostReviewsMap, setHostReviewsMap] = useState<Record<string, HostReview[]>>({})
  const [markDryLoadId, setMarkDryLoadId] = useState<string | null>(null)
  const [chatThreadId, setChatThreadId] = useState<string | null>(null)
  const [chatBooking, setChatBooking] = useState<Booking | null>(null)
  const chatReturnScreenRef = useRef<Screen>(defaultScreen(role))

  const guestBookingsRef = useRef(guestBookings)
  const selectedBookingIdRef = useRef(selectedBookingId)
  const activeLoadsRef = useRef(activeLoads)
  guestBookingsRef.current = guestBookings
  selectedBookingIdRef.current = selectedBookingId
  activeLoadsRef.current = activeLoads

  const activeGuestBookings = useMemo(
    () => filterActiveGuestBookings(guestBookings),
    [guestBookings],
  )

  const booking = useMemo(() => {
    if (selectedBookingId) {
      const selected = findGuestBooking(guestBookings, selectedBookingId)
      if (selected) {
        if (isActiveGuestBooking(selected) || selected.requestStatus === 'declined') {
          return selected
        }
      }
    }
    return activeGuestBookings[0] ?? null
  }, [guestBookings, selectedBookingId, activeGuestBookings])

  const selectGuestBooking = useCallback((bookingId: string) => {
    setSelectedBookingId(bookingId)
  }, [])

  useEffect(() => {
    if (!selectedBookingId) return
    const stillActive = findGuestBooking(guestBookings, selectedBookingId)
    if (stillActive && isActiveGuestBooking(stillActive)) return
    setSelectedBookingId(activeGuestBookings[0]?.id ?? null)
  }, [guestBookings, selectedBookingId, activeGuestBookings])

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
    void syncTrainingDemoIfNeeded().then(() => {
      if (role === 'host') {
        const seed = getHostDashboardSeed(user!.id)
        getHostOrders(user!.id).then((stored) => {
          const mergedLoads = dedupeActiveLoads(
            mergeActiveLoads(seed.activeLoads, stored.activeLoads),
          )
          const activeLoadIds = mergedLoads.map((load) => load.id)
          setHostRequests(
            mergeHostRequests(seed.pendingRequests, stored.pendingRequests, activeLoadIds),
          )
          setActiveLoads(mergedLoads)
          setHostStats({
            loadsToday: seed.loadsToday,
            maxLoads: seed.maxLoads,
            accepting: seed.accepting,
          })
        })
      } else {
        void loadActiveBookings(user!.id).then((stored) => {
          const seed = filterActiveGuestBookings(
            [getCustomerSeedBooking(user!.id)].filter((entry): entry is Booking => !!entry),
          )
          const merged = mergeGuestBookings(seed, stored)
          setGuestBookings(merged)
          setSelectedBookingId((current) =>
            current && findGuestBooking(merged, current) ? current : merged[0]?.id ?? null,
          )
        })
      }
    })
  }, [role, user!.id])

  useEffect(() => {
    if (role === 'customer' && user) {
      void saveActiveBookings(user.id, guestBookings)
    }
  }, [guestBookings, role, user])

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

  const findBookingForChat = useCallback(
    (bookingId: string): Booking | null => {
      const fromGuest = findGuestBooking(guestBookingsRef.current, bookingId)
      if (fromGuest) return fromGuest

      const fromActive = activeLoadsRef.current.find((load) => load.id === bookingId)
      if (fromActive) return fromActive

      const request = hostRequests.find((entry) => entry.id === bookingId)
      if (request && user && role === 'host') {
        const hostProfile = getHostByUserId(user.id)
        if (!hostProfile) return null
        return {
          id: request.id,
          hostId: hostProfile.id,
          hostName: hostProfile.name,
          customerId: request.customerId,
          customerName: request.customerName,
          location: request.location,
          loads: request.loads,
          dropOffTime: request.dropOffTime,
          sheetsOption: request.sheetsOption,
          notes: request.notes ?? '',
          stage: 'got-bag',
          address: hostProfile.address,
          gateCode: hostProfile.gateCode,
          stageTimes: {},
          paymentMethod: request.paymentMethod,
          foldingService: request.foldingService,
          totalAmount: request.totalAmount,
          paymentStatus: 'pending',
          requestStatus: request.status === 'pending' ? 'pending' : 'accepted',
          loadPhotoUri: request.loadPhotoUri,
          clothesList: request.clothesList,
        }
      }

      return null
    },
    [hostRequests, role, user],
  )

  const openChat = useCallback(
    (threadId: string, bookingId?: string) => {
      chatReturnScreenRef.current = screen
      setChatThreadId(threadId)
      if (bookingId) {
        const found = findBookingForChat(bookingId)
        setChatBooking(found)
        if (role === 'customer' && found) {
          setSelectedBookingId(bookingId)
        }
      } else {
        setChatBooking(null)
      }
      setScreen('chat')
    },
    [findBookingForChat, role, screen],
  )

  const openSupportChat = useCallback(() => {
    if (!user) return
    openChat(supportThreadId(user.id))
  }, [openChat, user])

  const closeChat = useCallback(() => {
    setChatThreadId(null)
    setChatBooking(null)
    setScreen(chatReturnScreenRef.current)
  }, [])

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

  const refreshHostReviews = useCallback(async (hostId: string) => {
    const stored = await loadStoredReviewsForHost(hostId)
    setHostReviewsMap((prev) => ({ ...prev, [hostId]: stored }))
  }, [])

  const getReviewsForHost = useCallback(
    (hostId: string) => mergeHostReviews(hostId, hostReviewsMap[hostId] ?? []),
    [hostReviewsMap],
  )

  const openLeaveReview = useCallback(
    (hostId: string, bookingId?: string) => {
      setReviewHostId(hostId)
      setReviewBookingId(bookingId ?? null)
      void refreshHostReviews(hostId)
      setScreen('customer-leave-review')
    },
    [refreshHostReviews],
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
    async (
      hostUserId: string | undefined,
      title: string,
      body: string,
      link?: NotificationLink,
      kind: 'request' | 'update' = 'request',
    ) => {
      if (!hostUserId) return
      const settings = hostSettingsMap[hostUserId]
      if (kind === 'update') {
        if (settings?.notifyBookingUpdates === false) return
      } else if (settings?.notifyNewRequests === false) {
        return
      }
      await push(hostUserId, title, body, link)
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

  const submitHostReview = useCallback(
    async ({
      hostId,
      bookingId,
      rating,
      comment,
    }: {
      hostId: string
      bookingId?: string | null
      rating: number
      comment: string
    }) => {
      if (!user) return
      const review: HostReview = {
        id: `rev-${Date.now()}`,
        author: user.name,
        rating,
        comment,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      }
      await saveReviewForHost(hostId, review)
      if (bookingId) await markBookingReviewed(user.id, bookingId)
      await refreshHostReviews(hostId)

      const host = getHostById(hostId)
      if (host?.hostUserId) {
        const preview =
          comment.length > 80 ? `${comment.slice(0, 77).trim()}…` : comment.trim()
        void notifyHost(
          host.hostUserId,
          'New Review',
          `${user.name} left a ${rating}/5 review: "${preview}"`,
          hostProfileLink(hostId),
          'update',
        )
      }

      setReviewHostId(null)
      setReviewBookingId(null)
      showToast('Review submitted', { icon: 'star' })
    },
    [notifyHost, refreshHostReviews, showToast, user],
  )

  const restoreBookingForGuest = useCallback(
    async (bookingId?: string): Promise<Booking | null> => {
      if (!user) return null

      if (bookingId) {
        const fromCurrent = findGuestBooking(guestBookingsRef.current, bookingId)
        if (fromCurrent && isActiveGuestBooking(fromCurrent)) return fromCurrent

        const stored = await loadActiveBookings(user.id)
        const fromStored = findGuestBooking(stored, bookingId)
        if (fromStored) return fromStored

        const history = await loadCustomerPaymentHistory(user.id)
        const fromHistory = history.find((entry) => entry.id === bookingId)
        if (fromHistory) return fromHistory

        const seed = getCustomerSeedBooking(user.id)
        if (seed?.id === bookingId) return seed

        return null
      }

      const current = guestBookingsRef.current.find(isActiveGuestBooking)
      if (current) return current

      const stored = await loadActiveBookings(user.id)
      return stored[0] ?? null
    },
    [user],
  )

  const clearBooking = useCallback(() => {
    const bookingId = selectedBookingIdRef.current
    if (!bookingId) return
    setGuestBookings((prev) => removeGuestBooking(prev, bookingId))
  }, [])

  const openNotification = useCallback(
    async (notification: AppNotification) => {
      const link = resolveNotificationLink(notification, role)
      if (!link) {
        setScreen('notifications')
        return
      }

      if (link.screen === 'chat') {
        openChat(link.threadId, link.bookingId)
        return
      }

      if (link.screen === 'customer-tracking') {
        const restored = await restoreBookingForGuest(link.bookingId || undefined)
        if (restored) {
          setGuestBookings((prev) => upsertGuestBooking(prev, restored))
          setSelectedBookingId(restored.id)
        }
        setScreen('customer-tracking')
        return
      }

      if (link.screen === 'customer-leave-review') {
        if (!link.hostId) {
          showToast('Review link expired — open your latest pickup alert', { icon: 'info' })
          setScreen('notifications')
          return
        }
        openLeaveReview(link.hostId, link.bookingId)
        return
      }

      if (link.screen === 'customer-host-profile') {
        const host = getHostById(link.hostId)
        if (host) {
          viewHostProfile(host)
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
    [openChat, openLeaveReview, restoreBookingForGuest, role, showToast, viewHostProfile],
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
        createdAt: new Date().toISOString(),
      }
      setGuestBookings((prev) => upsertGuestBooking(prev, newBooking))
      setSelectedBookingId(bookingId)
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
        : { dryPrice: 0, foldingPrice: 0, sheetsPrice: DRYER_SHEETS_PRICE }

      const load: Booking = {
        id: request.id,
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
        acceptedAt: nowTime(),
        stageTimes: {},
      }

      const nextRequests = hostRequests.filter((r) => r.id !== requestId)
      const nextLoads = upsertActiveLoad(activeLoads, load)
      setActiveLoads(nextLoads)
      setHostRequests(nextRequests)
      setHostStats((prev) => ({ ...prev, loadsToday: prev.loadsToday + 1 }))
      void saveHostOrders(user.id, { pendingRequests: nextRequests, activeLoads: nextLoads })

      setGuestBookings((prev) =>
        patchGuestBooking(prev, request.id, (current) => ({
          ...current,
          ...load,
          requestStatus: 'accepted',
          isNew: false,
        })),
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
      setGuestBookings((prev) =>
        patchGuestBooking(prev, requestId, (current) => ({ ...current, requestStatus: 'declined' })),
      )
      showToast('Request declined', { icon: 'x-circle' })
    },
    [hostRequests, activeLoads, user, notifyCustomer, showToast],
  )

  const cancelPendingRequest = useCallback(
    (bookingId: string) => {
      const current = findGuestBooking(guestBookingsRef.current, bookingId)
      if (!current || current.requestStatus !== 'pending') return
      if (!canGuestCancelPendingRequest(current)) {
        showToast('You can cancel 30 minutes after sending the request', { icon: 'clock' })
        return
      }
      if (!user) return

      const host = getHostById(current.hostId)
      if (host?.hostUserId) {
        void removeHostPendingRequest(host.hostUserId, bookingId)
        notifyHost(
          host.hostUserId,
          'Request cancelled',
          `${user.name} cancelled their load request.`,
          hostDashboardLink(),
          'update',
        )
      }

      setGuestBookings((prev) => removeGuestBooking(prev, bookingId))
      setScreen('customer-home')
      showToast('Request cancelled', { icon: 'x-circle' })
    },
    [notifyHost, showToast, user],
  )

  const markBagReceived = useCallback(
    (loadId: string) => {
      const time = nowTime()
      const patch = (load: Booking): Booking => ({
        ...load,
        stageTimes: { ...load.stageTimes, 'got-bag': time },
      })

      let target: Booking | undefined

      setActiveLoads((prev) => {
        const next = prev.map((load) => {
          if (load.id !== loadId) return load
          target = load
          return patch(load)
        })
        if (role === 'host' && user) {
          void saveHostOrders(user.id, { pendingRequests: hostRequests, activeLoads: next })
        }
        return next
      })

      setGuestBookings((prev) => {
        const existing = findGuestBooking(prev, loadId)
        if (existing) target = existing
        return patchGuestBooking(prev, loadId, patch)
      })

      if (target?.customerId) {
        notifyCustomer(
          target.customerId,
          'Bag received',
          `${target.hostName} has your laundry — we'll update you when it's in the dryer.`,
          bookingTrackingLink(target.id),
        )
        showToast('Guest notified — bag received', { icon: 'check-circle' })
      }
    },
    [hostRequests, notifyCustomer, role, showToast, user],
  )

  const advanceStage = useCallback(
    (loadId: string, stage: BookingStage, extras?: { dryPhotoUri?: string }) => {
      const targetLoad =
        activeLoadsRef.current.find((load) => load.id === loadId) ??
        findGuestBooking(guestBookingsRef.current, loadId)

      const time = nowTime()
      const completedDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })

      const patchLoad = (load: Booking): Booking => {
        const stageTimes = { ...load.stageTimes, [stage]: time }
        if (stage === 'drying' && !load.stageTimes['got-bag']) {
          stageTimes['got-bag'] = time
        }

        return {
          ...load,
          stage,
          stageTimes,
          ...(extras?.dryPhotoUri ? { dryPhotoUri: extras.dryPhotoUri } : {}),
          ...(stage === 'picked-up'
            ? {
                completedAt: completedDate,
                paymentStatus:
                  load.paymentMethod === 'cash' || load.paymentStatus === 'paid'
                    ? ('paid' as const)
                    : (load.paymentStatus ?? 'pending'),
              }
            : {}),
        }
      }

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
        const filtered = stage === 'picked-up' ? next.filter((load) => load.id !== loadId) : next
        if (role === 'host' && user) {
          void saveHostOrders(user.id, { pendingRequests: hostRequests, activeLoads: filtered })
        }
        return filtered
      })

      setGuestBookings((prev) => {
        const existing = findGuestBooking(prev, loadId)
        if (existing) {
          notifyTarget = existing
          persistIfPickedUp(existing)
        }
        if (stage === 'picked-up') {
          return removeGuestBooking(prev, loadId)
        }
        return patchGuestBooking(prev, loadId, patchLoad)
      })

      if (stage === 'picked-up' && targetLoad) {
        const host = getHostById(targetLoad.hostId)
        if (host?.hostUserId) {
          void removeHostActiveLoad(host.hostUserId, loadId)
        }
      }

      if (notifyTarget?.customerId && stage !== 'picked-up') {
        const title = stage === 'ready' ? 'Ready for pickup' : STAGE_LABELS[stage]
        const body =
          stage === 'ready'
            ? `${notifyTarget.hostName} marked your load dry — ready for pickup!`
            : `${notifyTarget.hostName} updated your load — ${STAGE_LABELS[stage].toLowerCase()}.`
        notifyCustomer(notifyTarget.customerId, title, body, bookingTrackingLink(notifyTarget.id))
      }
    },
    [notifyCustomer, role, user, hostRequests],
  )

  const confirmPickup = useCallback(
    (loadId: string) => {
      const pickedUp =
        activeLoadsRef.current.find((load) => load.id === loadId) ??
        findGuestBooking(guestBookingsRef.current, loadId)

      advanceStage(loadId, 'picked-up')

      if (pickedUp?.customerId) {
        void notifyCustomer(
          pickedUp.customerId,
          'Leave A Review',
          `Thanks for picking up from ${pickedUp.hostName}! Leave a review to help others find great hosts.`,
          hostReviewLink(pickedUp.hostId, pickedUp.id),
        )
      }

      const host = pickedUp ? getHostById(pickedUp.hostId) : undefined
      if (host?.hostUserId && pickedUp) {
        void notifyHost(
          host.hostUserId,
          'Ask For A Review',
          `${pickedUp.customerName} picked up their load. Ask them to leave a review on Laundry Buddy — it helps you get more bookings.`,
          hostDashboardLink(),
          'update',
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

  const openMarkDry = useCallback((loadId: string) => {
    setMarkDryLoadId(loadId)
    setScreen('host-mark-dry')
  }, [])

  const markDry = useCallback(
    (loadId: string, dryPhotoUri?: string) => {
      advanceStage(loadId, 'ready', dryPhotoUri ? { dryPhotoUri } : undefined)
      setMarkDryLoadId(null)
      showToast('Load marked dry — guest notified', { icon: 'check-circle' })
      setScreen('host-dashboard')
    },
    [advanceStage, showToast],
  )

  const markPaymentProofSent = useCallback(
    (loadId: string) => {
      const timestamp = new Date().toISOString()
      const patch = (load: Booking): Booking => ({
        ...load,
        paymentProofSentAt: load.paymentProofSentAt ?? timestamp,
      })

      setActiveLoads((prev) => {
        const next = prev.map((load) => (load.id === loadId ? patch(load) : load))
        if (role === 'host' && user) {
          void saveHostOrders(user.id, { pendingRequests: hostRequests, activeLoads: next })
        }
        return next
      })

      setGuestBookings((prev) => patchGuestBooking(prev, loadId, patch))
    },
    [hostRequests, role, user],
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

      setGuestBookings((prev) => {
        const existing = findGuestBooking(prev, loadId)
        if (existing) target = existing
        return patchGuestBooking(prev, loadId, markPaid)
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
      guestBookings,
      activeGuestBookings,
      selectGuestBooking,
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
      openLeaveReview,
      submitHostReview,
      getReviewsForHost,
      refreshHostReviews,
      reviewHostId,
      reviewBookingId,
      selectHost,
      setShowMap,
      getSettingsForHost,
      updateHostSettings,
      confirmBooking,
      acceptRequest,
      declineRequest,
      cancelPendingRequest,
      clearBooking,
      markBagReceived,
      advanceStage,
      openMarkDry,
      markDryLoadId,
      markDry,
      confirmPickup,
      confirmTransferPayment,
      markPaymentProofSent,
      chatThreadId,
      chatBooking,
      openChat,
      openSupportChat,
      findBookingForChat,
      closeChat,
      openNotification,
      openNotificationFromPush,
    }),
    [
      screen,
      selectedHost,
      booking,
      guestBookings,
      activeGuestBookings,
      selectGuestBooking,
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
      openLeaveReview,
      submitHostReview,
      getReviewsForHost,
      refreshHostReviews,
      reviewHostId,
      reviewBookingId,
      selectHost,
      getSettingsForHost,
      updateHostSettings,
      confirmBooking,
      acceptRequest,
      declineRequest,
      cancelPendingRequest,
      clearBooking,
      markBagReceived,
      advanceStage,
      openMarkDry,
      markDryLoadId,
      markDry,
      confirmPickup,
      confirmTransferPayment,
      markPaymentProofSent,
      chatThreadId,
      chatBooking,
      openChat,
      openSupportChat,
      findBookingForChat,
      closeChat,
      openNotification,
      openNotificationFromPush,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
