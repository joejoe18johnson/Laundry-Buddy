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
  getCustomerSeedBookings,
  getHostByUserId,
  getHostById,
  getHostDashboardSeed,
  getAvailableHosts,
} from '../data/mockData'
import { getAllUsers } from '../lib/authStorage'
import { calculateBookingTotal, applyHostPricing, getHostPricing, DRYER_SHEETS_PRICE } from '../lib/hostPricing'
import { formatMoney, getBookingAmount } from '../lib/bookingPayments'
import { applyHostSettings } from '../lib/hostListing'
import { mergeRemoteMarketplaceCatalog } from '../lib/hostCatalog'
import { resolveGuestFacingHostSettings } from '../lib/defaultHostSettings'
import { scheduleDropOffReminder } from '../lib/pushNotifications'
import { formatClothesListSummary, hasDelicates } from '../lib/clothesList'
import { formatHostDisplayName } from '../lib/displayName'
import { getIdentityVerification, isIdentityVerified, marketplaceLockMessage } from '../lib/identityVerification'
import { VERIFICATION_APPROVED_TITLE } from '../lib/verificationCodes'
import { NEW_BOOKING_NOTIFICATION_TITLE, isNewBookingNotification } from '../lib/hostNotifications'
import {
  saveCompletedCustomerPayment,
  saveCompletedHostPayment,
  loadCustomerPaymentHistory,
} from '../lib/paymentHistoryStorage'
import { loadActiveBookings, saveActiveBookings } from '../lib/bookingStorage'
import {
  loadBookingSnapshotsForCustomer,
  mergeBookingSnapshot,
  removeBookingSnapshot,
  saveBookingSnapshot,
} from '../lib/bookingSyncStorage'
import { homeScreenForRole, mainTabScreens } from '../lib/navigationBack'
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
  milesToKm,
  type Coordinates,
} from '../lib/geo'
import { USER_LOCATION } from '../lib/mapRegion'
import {
  loadLocationPreferences,
  saveLocationPreferences,
  DEFAULT_SEARCH_RADIUS_MILES,
  type LocationPreferences,
  type RadiusOptionMiles,
} from '../lib/locationPreferences'
import { FILTER_AREA_RADIUS_MILES, getFilterAreaCenter } from '../lib/belizeDistricts'
import * as Location from 'expo-location'
import Constants from 'expo-constants'
import * as Linking from 'expo-linking'
import { formatDropOffHour, type DropOffHour } from '../lib/dropOffAvailability'
import { canGuestCancelPendingRequest } from '../lib/pendingRequestCancel'
import { deliverPaymentRequest, needsPaymentRequest, withPaymentRequestedAt } from '../lib/paymentRequestDelivery'
import { inquiryThreadId, supportThreadId } from '../lib/chatThreads'
import { syncTrainingDemoIfNeeded } from '../lib/trainingSeedStorage'
import { parseHostProfileLink } from '../lib/hostProfileLinks'
import {
  buildHostListingForSync,
  fetchHostListingFromSupabase,
  upsertHostListingToSupabase,
} from '../lib/supabase/hostService'
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
  searchRadiusMiles: RadiusOptionMiles
  requestUserLocation: () => Promise<void>
  fetchGpsLocation: () => Promise<Coordinates | null>
  applyLocationPreferences: (prefs: LocationPreferences) => void
  setLocationPreset: (label: string, latitude: number, longitude: number) => void
  focusSearchOnArea: (area: string) => void
  setSearchRadiusMiles: (miles: RadiusOptionMiles) => void
  showMap: boolean
  refreshHostData: () => Promise<void>
  refreshHostOrders: () => Promise<void>
  refreshGuestBookings: () => Promise<void>
  refreshAtHome: () => Promise<void>
  homeRefreshKey: number
  navigate: (screen: Screen) => void
  goBack: () => boolean
  registerHardwareBackHandler: (handler: (() => boolean) | null) => void
  viewHostProfile: (host: Host) => void
  openHostProfileFromLink: (hostId: string, hostUserId?: string) => Promise<boolean>
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
  openHostInquiryChat: (host: Host) => void
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
  clearMarkDryFocus: () => void
  markDry: (loadId: string, dryPhotoUri?: string) => void
  confirmPickup: (loadId: string) => void
  confirmTransferPayment: (loadId: string) => void
  sendPaymentRequest: (loadId: string) => void
  markPaymentProofSent: (loadId: string, proofUri?: string) => void
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
  'got-bag': 'Bag received',
  waiting: 'Bag received',
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

function persistBookingSnapshot(booking: Booking) {
  void saveBookingSnapshot(booking)
}

function defaultScreen(role: 'customer' | 'host'): Screen {
  return role === 'host' ? 'host-dashboard' : 'customer-home'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, refreshCurrentUser } = useAuth()
  const { push } = useNotifications()
  const { showToast } = useToast()
  // AppProvider is only mounted for customer/host sessions (see App.tsx).
  const role = user!.role as 'customer' | 'host'

  const hostSeed = role === 'host' ? getHostDashboardSeed(user!.id) : null
  const customerSeedBookings =
    role === 'customer' ? filterActiveGuestBookings(getCustomerSeedBookings(user!.id)) : []

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
  const [dynamicHostsVersion, setDynamicHostsVersion] = useState(0)
  const [hostSettings, setHostSettings] = useState<HostSettings | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [userLocation, setUserLocation] = useState<Coordinates>(USER_LOCATION)
  const [userLocationLabel, setUserLocationLabel] = useState('San Ignacio')
  const [locationLoading, setLocationLoading] = useState(false)
  const [searchRadiusMiles, setSearchRadiusMilesState] = useState<RadiusOptionMiles>(DEFAULT_SEARCH_RADIUS_MILES)
  const [reviewHostId, setReviewHostId] = useState<string | null>(null)
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null)
  const [hostReviewsMap, setHostReviewsMap] = useState<Record<string, HostReview[]>>({})
  const [markDryLoadId, setMarkDryLoadId] = useState<string | null>(null)
  const [chatThreadId, setChatThreadId] = useState<string | null>(null)
  const [chatBooking, setChatBooking] = useState<Booking | null>(null)
  const chatReturnScreenRef = useRef<Screen>(defaultScreen(role))
  const screenHistoryRef = useRef<Screen[]>([])
  const hardwareBackHandlerRef = useRef<(() => boolean) | null>(null)
  const [homeRefreshKey, setHomeRefreshKey] = useState(0)

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
    void (async () => {
      const prefs = await loadLocationPreferences()
      setUserLocation(prefs.userLocation)
      setUserLocationLabel(prefs.userLocationLabel)
      setSearchRadiusMilesState(prefs.searchRadiusMiles)

      // Standalone APK uses MapLibre; refresh GPS when permission is already granted.
      if (Constants.appOwnership === 'expo') return

      const { status: initialStatus } = await Location.getForegroundPermissionsAsync()
      let status = initialStatus
      if (status === 'undetermined') {
        const requested = await Location.requestForegroundPermissionsAsync()
        status = requested.status
      }
      if (status !== 'granted') return

      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setUserLocation(coords)
        setUserLocationLabel('Your location')
        await saveLocationPreferences({
          userLocation: coords,
          userLocationLabel: 'Your location',
          searchRadiusMiles: prefs.searchRadiusMiles,
        })
      } catch {
        // Keep saved prefs when GPS is temporarily unavailable.
      }
    })()
  }, [])

  const persistLocationPrefs = useCallback(
    (location: Coordinates, label: string, radiusMiles: RadiusOptionMiles) => {
      void saveLocationPreferences({
        userLocation: location,
        userLocationLabel: label,
        searchRadiusMiles: radiusMiles,
      })
    },
    [],
  )

  useEffect(() => {
    if (role === 'host' && user) {
      setHostSettings(hostSettingsMap[user.id] ?? { ...DEFAULT_HOST_SETTINGS })
    }
  }, [hostSettingsMap, role, user?.id])

  const applyGuestBookingsFromStorage = useCallback(async () => {
    if (role !== 'customer' || !user) return
    const stored = await loadActiveBookings(user.id)
    const seed = filterActiveGuestBookings(getCustomerSeedBookings(user.id))
    const snapshots = await loadBookingSnapshotsForCustomer(user.id)
    const merged = mergeGuestBookings(seed, stored).map((booking) => {
      const snapshot = snapshots.find((entry) => entry.id === booking.id)
      return snapshot ? mergeBookingSnapshot(booking, snapshot) : booking
    })
    for (const snapshot of snapshots) {
      if (!merged.some((entry) => entry.id === snapshot.id)) {
        merged.push(snapshot)
      }
    }
    const active = filterActiveGuestBookings(merged)
    setGuestBookings(active)
    setSelectedBookingId((current) =>
      current && findGuestBooking(active, current) ? current : active[0]?.id ?? null,
    )
  }, [role, user])

  useEffect(() => {
    screenHistoryRef.current = []
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
        void applyGuestBookingsFromStorage()
      }
    })
  }, [applyGuestBookingsFromStorage, role, user!.id])

  useEffect(() => {
    if (role === 'customer' && user) {
      void saveActiveBookings(user.id, guestBookings)
    }
  }, [guestBookings, role, user])

  const allOnlineHosts = useMemo(() => {
    const available = getAvailableHosts()
      .filter((h) => isHostOnline(h.hostUserId, hostSettingsMap))
      .map((h) =>
        applyHostSettings(h, h.hostUserId ? hostSettingsMap[h.hostUserId] : undefined),
      )
    return enrichHostsWithDistance(available, userLocation)
  }, [hostSettingsMap, userLocation, dynamicHostsVersion])

  const onlineHosts = useMemo(
    () => filterHostsWithinRadius(allOnlineHosts, userLocation, milesToKm(searchRadiusMiles)),
    [allOnlineHosts, userLocation, searchRadiusMiles],
  )

  const setLocationPreset = useCallback(
    (label: string, latitude: number, longitude: number) => {
      const coords = { latitude, longitude }
      setUserLocation(coords)
      setUserLocationLabel(label)
      persistLocationPrefs(coords, label, searchRadiusMiles)
      showToast('Search area saved', { icon: 'check' })
    },
    [persistLocationPrefs, searchRadiusMiles, showToast],
  )

  const applyLocationPreferences = useCallback(
    (prefs: LocationPreferences) => {
      const miles = prefs.searchRadiusMiles
      setUserLocation(prefs.userLocation)
      setUserLocationLabel(prefs.userLocationLabel)
      setSearchRadiusMilesState(miles)
      persistLocationPrefs(prefs.userLocation, prefs.userLocationLabel, miles)
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
        searchRadiusMiles: FILTER_AREA_RADIUS_MILES,
      })
    },
    [applyLocationPreferences],
  )

  const setSearchRadiusMiles = useCallback(
    (miles: RadiusOptionMiles) => {
      applyLocationPreferences({
        userLocation,
        userLocationLabel,
        searchRadiusMiles: miles,
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
      searchRadiusMiles,
    })
  }, [applyLocationPreferences, fetchGpsLocation, searchRadiusMiles])

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
      if (settings.isOnline && !isIdentityVerified(user)) {
        showToast(marketplaceLockMessage('host', getIdentityVerification(user).status), { icon: 'shield' })
        setScreen('identity-verification')
        return
      }
      const wasOnline = hostSettingsMap[user.id]?.isOnline ?? false
      const mergedMap = { ...hostSettingsMap, [user.id]: settings }
      await saveHostSettings(user.id, settings)
      setHostSettings(settings)
      setHostSettingsMap(mergedMap)

      const existingHost = getHostByUserId(user.id)
      const syncedHost = buildHostListingForSync(user, settings, existingHost ?? null)
      setDynamicHostsVersion((version) => version + 1)
      const syncResult = await upsertHostListingToSupabase(user, syncedHost, settings)
      if (!syncResult.ok) {
        showToast(syncResult.error ?? 'Could not sync listing to the server', { icon: 'alert-circle' })
      }

      const { settingsMap } = await mergeRemoteMarketplaceCatalog(mergedMap)
      setHostSettingsMap(settingsMap)
      setDynamicHostsVersion((version) => version + 1)
      showToast('Settings saved', { icon: 'check' })

      if (!wasOnline && settings.isOnline && settings.notifyGuestsWhenOnline) {
        const hostProfile = getHostByUserId(user.id)
        if (hostProfile) {
          const customers = (await getAllUsers()).filter((u) => u.role === 'customer')
          await Promise.all(
            customers.map((c) =>
              push(
                c.id,
                `${formatHostDisplayName(hostProfile.name)} is online`,
                `${formatHostDisplayName(hostProfile.name)} is accepting loads in ${hostProfile.location}. Book now while they are online.`,
              ),
            ),
          )
        }
      }
    },
    [role, user, hostSettingsMap, push, showToast],
  )

  const refreshHostOrders = useCallback(async () => {
    if (role !== 'host' || !user) return
    const seed = getHostDashboardSeed(user.id)
    const stored = await getHostOrders(user.id)
    const mergedLoads = dedupeActiveLoads(mergeActiveLoads(seed.activeLoads, stored.activeLoads))
    const activeLoadIds = mergedLoads.map((load) => load.id)
    setHostRequests(mergeHostRequests(seed.pendingRequests, stored.pendingRequests, activeLoadIds))
    setActiveLoads(mergedLoads)
  }, [role, user])

  const refreshHostData = useCallback(async () => {
    const map = await getAllHostSettings()
    const { settingsMap } = await mergeRemoteMarketplaceCatalog(map)
    setHostSettingsMap(settingsMap)
    if (role === 'host' && user) {
      setHostSettings(settingsMap[user.id] ?? { ...DEFAULT_HOST_SETTINGS })
    }
    setDynamicHostsVersion((version) => version + 1)
  }, [role, user])

  useEffect(() => {
    void refreshHostData()
  }, [refreshHostData, user?.id, user?.identityVerification?.status])

  const navigate = useCallback((next: Screen) => {
    setScreen((current) => {
      if (current !== next) {
        screenHistoryRef.current.push(current)
      }
      return next
    })
  }, [])

  const registerHardwareBackHandler = useCallback((handler: (() => boolean) | null) => {
    hardwareBackHandlerRef.current = handler
  }, [])

  const refreshGuestBookings = useCallback(async () => {
    await applyGuestBookingsFromStorage()
  }, [applyGuestBookingsFromStorage])

  const refreshAtHome = useCallback(async () => {
    if (role === 'host') {
      await refreshHostOrders()
    }
    await refreshHostData()
    if (role === 'customer') {
      await refreshGuestBookings()
    }
    setHomeRefreshKey((key) => key + 1)
    showToast('Refreshed', { icon: 'refresh-cw' })
  }, [refreshGuestBookings, refreshHostData, refreshHostOrders, role, showToast])

  const requireMarketplaceAccess = useCallback(() => {
    if (!user || isIdentityVerified(user)) return true
    showToast(marketplaceLockMessage(user.role, getIdentityVerification(user).status), { icon: 'shield' })
    setScreen('identity-verification')
    return false
  }, [user, showToast])

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
          hostName: formatHostDisplayName(hostProfile.name),
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

  const goBack = useCallback((): boolean => {
    if (hardwareBackHandlerRef.current?.()) return true

    if (screen === 'chat') {
      closeChat()
      return true
    }

    if (screen === 'host-mark-dry') {
      setMarkDryLoadId(null)
      setScreen('host-dryer')
      return true
    }

    const homeScreen = homeScreenForRole(role)
    const history = screenHistoryRef.current
    if (history.length > 0) {
      setScreen(history.pop()!)
      return true
    }

    if (screen === homeScreen) {
      void refreshAtHome()
      return true
    }

    const tabs = mainTabScreens(role)
    if (tabs.includes(screen)) {
      setScreen(homeScreen)
      return true
    }

    setScreen(homeScreen)
    return true
  }, [closeChat, refreshAtHome, role, screen])

  useEffect(() => {
    if (!selectedHost?.hostUserId) return
    const settings = hostSettingsMap[selectedHost.hostUserId]
    if (!settings) return
    setSelectedHost((current) => {
      if (!current || current.hostUserId !== selectedHost.hostUserId) return current
      const next = applyHostSettings(current, settings)
      if (
        next.price === current.price &&
        next.foldingPrice === current.foldingPrice &&
        next.sheetsPrice === current.sheetsPrice &&
        next.location === current.location
      ) {
        return current
      }
      return next
    })
  }, [hostSettingsMap, selectedHost?.hostUserId])

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

  const openHostProfileFromLink = useCallback(
    async (hostId: string, hostUserId?: string) => {
      let host =
        getHostById(hostId) ?? (hostUserId ? getHostByUserId(hostUserId) : undefined)
      let settingsOverride: HostSettings | undefined

      if (!host) {
        const remote = await fetchHostListingFromSupabase(hostId, hostUserId)
        if (remote) {
          host = remote.host
          settingsOverride = remote.settings
          const remoteUserId = remote.host.hostUserId
          if (remoteUserId) {
            setHostSettingsMap((prev) => ({ ...prev, [remoteUserId]: remote.settings }))
          }
          setDynamicHostsVersion((version) => version + 1)
        }
      }

      if (!host) {
        showToast('Host profile is not available yet', { icon: 'user' })
        return false
      }

      const resolved = applyHostSettings(
        host,
        settingsOverride ?? (host.hostUserId ? hostSettingsMap[host.hostUserId] : undefined),
      )
      setSelectedHost(resolved)
      setScreen('customer-host-profile')
      return true
    },
    [hostSettingsMap, showToast],
  )

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      const parsed = parseHostProfileLink(url)
      if (!parsed) return
      void openHostProfileFromLink(parsed.hostId, parsed.hostUserId)
    }

    void Linking.getInitialURL().then(handleUrl)
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url))
    return () => subscription.remove()
  }, [openHostProfileFromLink])

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
      if (role === 'host') {
        showToast('Hosts can browse listings but cannot book or message other hosts.', { icon: 'info' })
        return
      }
      if (!requireMarketplaceAccess()) return
      const resolved = applyHostSettings(
        host,
        host.hostUserId ? hostSettingsMap[host.hostUserId] : undefined,
      )
      setSelectedHost(resolved)
      setScreen('customer-booking')
    },
    [hostSettingsMap, requireMarketplaceAccess, role, showToast],
  )

  const openHostInquiryChat = useCallback(
    (host: Host) => {
      if (!user) return
      if (role === 'host') {
        showToast('Hosts can browse listings but cannot book or message other hosts.', { icon: 'info' })
        return
      }
      if (!host.hostUserId) {
        showToast('This host is not available for messaging right now.', { icon: 'info' })
        return
      }
      openChat(inquiryThreadId(user.id, host.hostUserId))
    },
    [openChat, role, showToast, user],
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

        const seed = getCustomerSeedBookings(user.id).find((entry) => entry.id === bookingId)
        if (seed) return seed

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
      if (notification.title === VERIFICATION_APPROVED_TITLE) {
        await refreshCurrentUser()
      }
      if (isNewBookingNotification(notification.title)) {
        await refreshHostOrders()
      }

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

      if (link.screen === 'identity-verification') {
        setScreen('identity-verification')
        return
      }

      setScreen('customer-home')
    },
    [openChat, openLeaveReview, refreshCurrentUser, refreshHostOrders, restoreBookingForGuest, role, showToast, viewHostProfile],
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
      if (role === 'host') {
        showToast('Hosts can browse listings but cannot book or message other hosts.', { icon: 'info' })
        return
      }
      if (!requireMarketplaceAccess()) return

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
        hostName: formatHostDisplayName(selectedHost.name),
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
      persistBookingSnapshot(newBooking)

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
        NEW_BOOKING_NOTIFICATION_TITLE,
        `${user.name} · ${formatDropOffHour(details.dropOffTime)}${clothesSummary ? ` · ${clothesSummary}` : ''}${details.notes.trim() ? ` · "${details.notes.trim()}"` : ''}${delicateNote}${details.loadPhotoUri ? ' · Photo attached' : ''}`,
        hostDashboardLink(bookingId),
      )
      notifyCustomer(
        user.id,
        'Request sent',
        `${formatHostDisplayName(selectedHost.name)} will review your load request. We'll notify you when they accept.`,
        bookingTrackingLink(bookingId),
      )
      showToast('Request sent to host', { icon: 'send' })
    },
    [selectedHost, user, role, notifyHost, notifyCustomer, getSettingsForHost, showToast, requireMarketplaceAccess],
  )

  const acceptRequest = useCallback(
    (requestId: string) => {
      if (!requireMarketplaceAccess()) return
      const request = hostRequests.find((r) => r.id === requestId)
      if (!request || !user) return

      const settings = getSettingsForHost(user.id)
      const hostRaw = getHostByUserId(user.id)
      const hostProfile = hostRaw ? applyHostSettings(hostRaw, settings) : undefined
      const pricing = hostProfile
        ? getHostPricing(hostProfile, settings)
        : { dryPrice: 0, foldingPrice: 0, sheetsPrice: DRYER_SHEETS_PRICE }

      const needsTransfer =
        request.paymentMethod === 'bank_transfer' && (request.totalAmount ?? 0) > 0
      const needsCash = request.paymentMethod === 'cash' && (request.totalAmount ?? 0) > 0
      const acceptedAt = nowTime()
      const paymentTimestamp = new Date().toISOString()

      let load: Booking = {
        id: request.id,
        hostId: hostProfile?.id ?? 'unknown',
        hostName: formatHostDisplayName(hostProfile?.name ?? user.name),
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
        paymentStatus: (request.totalAmount ?? 0) <= 0 ? 'paid' : 'pending',
        paymentRequestedAt: needsTransfer ? paymentTimestamp : undefined,
        requestStatus: 'accepted',
        stage: 'got-bag',
        address: hostProfile?.address ?? '',
        gateCode: hostProfile?.gateCode ?? '',
        acceptedAt,
        stageTimes: {},
      }

      const nextRequests = hostRequests.filter((r) => r.id !== requestId)
      const nextLoads = upsertActiveLoad(activeLoads, load)
      setActiveLoads(nextLoads)
      setHostRequests(nextRequests)
      setHostStats((prev) => ({ ...prev, loadsToday: prev.loadsToday + 1 }))
      void saveHostOrders(user.id, { pendingRequests: nextRequests, activeLoads: nextLoads })
      persistBookingSnapshot(load)

      setGuestBookings((prev) =>
        patchGuestBooking(prev, request.id, (current) => ({
          ...current,
          ...load,
          requestStatus: 'accepted',
          isNew: false,
        })),
      )

      if (request.customerId) {
        const hostName = formatHostDisplayName(hostProfile?.name ?? user.name)
        if (needsTransfer) {
          void deliverPaymentRequest({
            load,
            hostUserId: user.id,
            hostName,
            bankDetails: settings.bankDetails,
            notifyCustomer,
            timestamp: paymentTimestamp,
          })
          void scheduleDropOffReminder(load.id, hostName, request.dropOffTime)
          showToast('Load accepted — guest notified to pay', { icon: 'credit-card' })
        } else if (needsCash) {
          notifyCustomer(
            request.customerId,
            'Load accepted',
            `${hostName} accepted your load! Pay ${formatMoney(request.totalAmount ?? 0)} in cash at drop-off — directions and gate code are in the app.`,
            bookingTrackingLink(load.id),
          )
          void scheduleDropOffReminder(load.id, hostName, request.dropOffTime)
          showToast('Load accepted — guest pays at drop-off', { icon: 'dollar-sign' })
        } else {
          notifyCustomer(
            request.customerId,
            'Load accepted',
            `${hostName} accepted your load! Open the app for drop-off directions and gate details.`,
            bookingTrackingLink(load.id),
          )
          void scheduleDropOffReminder(load.id, hostName, request.dropOffTime)
          showToast('Guest notified', { icon: 'check-circle' })
        }
      }
    },
    [hostRequests, activeLoads, user, notifyCustomer, getSettingsForHost, showToast, requireMarketplaceAccess],
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
      const declined = findGuestBooking(guestBookingsRef.current, requestId)
      if (declined) {
        persistBookingSnapshot({ ...declined, requestStatus: 'declined' })
      }
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
          const patched = patch(load)
          persistBookingSnapshot(patched)
          return patched
        })
        if (role === 'host' && user) {
          void saveHostOrders(user.id, { pendingRequests: hostRequests, activeLoads: next })
        }
        return next
      })

      setGuestBookings((prev) => {
        const existing = findGuestBooking(prev, loadId)
        if (existing) target = existing
        const next = patchGuestBooking(prev, loadId, patch)
        const updated = findGuestBooking(next, loadId)
        if (updated) persistBookingSnapshot(updated)
        return next
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
          const patched = patchLoad(load)
          if (stage === 'picked-up') {
            void removeBookingSnapshot(loadId)
          } else {
            persistBookingSnapshot(patched)
          }
          return patched
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
    setScreen('host-dryer')
  }, [])

  const clearMarkDryFocus = useCallback(() => {
    setMarkDryLoadId(null)
  }, [])

  const markDry = useCallback(
    (loadId: string, dryPhotoUri?: string) => {
      advanceStage(loadId, 'ready', dryPhotoUri ? { dryPhotoUri } : undefined)
      setMarkDryLoadId(null)
      showToast('Load marked dry — guest notified', { icon: 'check-circle' })
      setScreen('host-dryer')
    },
    [advanceStage, showToast],
  )

  const sendPaymentRequest = useCallback(
    (loadId: string) => {
      if (!user || role !== 'host') return

      const settings = getSettingsForHost(user.id)
      const timestamp = new Date().toISOString()
      let target: Booking | undefined
      let alreadySent = false

      const patch = (load: Booking): Booking => {
        if (load.id !== loadId) return load
        if (load.paymentRequestedAt) {
          target = load
          alreadySent = true
          return load
        }
        if (!needsPaymentRequest(load)) {
          target = load
          return load
        }
        const next = withPaymentRequestedAt(load, timestamp)
        target = next
        return next
      }

      setActiveLoads((prev) => {
        const next = prev.map(patch)
        if (role === 'host') {
          void saveHostOrders(user.id, { pendingRequests: hostRequests, activeLoads: next })
        }
        const updated = next.find((load) => load.id === loadId)
        if (updated) persistBookingSnapshot(updated)
        return next
      })

      setGuestBookings((prev) => patchGuestBooking(prev, loadId, patch))

      if (!target) return
      if (alreadySent) {
        showToast('Payment request already sent', { icon: 'credit-card' })
        return
      }
      if (target.paymentRequestedAt !== timestamp) return

      const hostProfile = getHostByUserId(user.id)
      void deliverPaymentRequest({
        load: target,
        hostUserId: user.id,
        hostName: formatHostDisplayName(hostProfile?.name ?? user.name),
        bankDetails: settings.bankDetails,
        notifyCustomer,
        timestamp,
      })

      showToast('Payment request sent to guest', { icon: 'credit-card' })
    },
    [getSettingsForHost, hostRequests, notifyCustomer, role, showToast, user],
  )

  const markPaymentProofSent = useCallback(
    (loadId: string, proofUri?: string) => {
      const timestamp = new Date().toISOString()
      const patch = (load: Booking): Booking => ({
        ...load,
        paymentProofSentAt: load.paymentProofSentAt ?? timestamp,
        paymentProofUri: proofUri ?? load.paymentProofUri,
      })

      setActiveLoads((prev) => {
        const next = prev.map((load) => (load.id === loadId ? patch(load) : load))
        if (role === 'host' && user) {
          void saveHostOrders(user.id, { pendingRequests: hostRequests, activeLoads: next })
        }
        const updated = next.find((load) => load.id === loadId)
        if (updated) persistBookingSnapshot(updated)
        return next
      })

      setGuestBookings((prev) => {
        const next = patchGuestBooking(prev, loadId, patch)
        const updated = findGuestBooking(next, loadId)
        if (updated) persistBookingSnapshot(updated)
        return next
      })
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
          const paid = markPaid(load)
          persistBookingSnapshot(paid)
          return paid
        })
        if (role === 'host' && user) {
          void saveHostOrders(user.id, { pendingRequests: hostRequests, activeLoads: next })
        }
        return next
      })

      setGuestBookings((prev) => {
        const existing = findGuestBooking(prev, loadId)
        if (existing) target = existing
        const next = patchGuestBooking(prev, loadId, markPaid)
        const updated = findGuestBooking(next, loadId)
        if (updated) persistBookingSnapshot(updated)
        return next
      })

      if (target?.customerId) {
        const amount = formatMoney(target.totalAmount ?? 0)
        const isCash = target.paymentMethod === 'cash'
        notifyCustomer(
          target.customerId,
          isCash ? 'Cash confirmed' : 'Payment verified',
          isCash
            ? `${target.hostName} confirmed your ${amount} cash payment at drop-off.`
            : `${target.hostName} confirmed your bank transfer of ${amount}.`,
          bookingTrackingLink(target.id),
        )
        showToast(isCash ? 'Cash payment confirmed' : 'Payment marked received', { icon: 'check-circle' })
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
      searchRadiusMiles,
      requestUserLocation,
      fetchGpsLocation,
      applyLocationPreferences,
      setLocationPreset,
      focusSearchOnArea,
      setSearchRadiusMiles,
      showMap,
      refreshHostData,
      refreshHostOrders,
      refreshGuestBookings,
      refreshAtHome,
      homeRefreshKey,
      navigate,
      goBack,
      registerHardwareBackHandler,
      viewHostProfile,
      openHostProfileFromLink,
      openLeaveReview,
      submitHostReview,
      getReviewsForHost,
      refreshHostReviews,
      reviewHostId,
      reviewBookingId,
      selectHost,
      openHostInquiryChat,
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
      clearMarkDryFocus,
      markDry,
      confirmPickup,
      confirmTransferPayment,
      sendPaymentRequest,
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
      searchRadiusMiles,
      requestUserLocation,
      fetchGpsLocation,
      applyLocationPreferences,
      setLocationPreset,
      focusSearchOnArea,
      setSearchRadiusMiles,
      showMap,
      refreshHostData,
      refreshHostOrders,
      refreshGuestBookings,
      refreshAtHome,
      homeRefreshKey,
      navigate,
      goBack,
      registerHardwareBackHandler,
      viewHostProfile,
      openHostProfileFromLink,
      openLeaveReview,
      submitHostReview,
      getReviewsForHost,
      refreshHostReviews,
      reviewHostId,
      reviewBookingId,
      selectHost,
      openHostInquiryChat,
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
      clearMarkDryFocus,
      markDry,
      confirmPickup,
      confirmTransferPayment,
      sendPaymentRequest,
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
