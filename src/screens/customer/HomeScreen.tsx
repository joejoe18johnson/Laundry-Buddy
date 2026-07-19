import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
  type LayoutChangeEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon } from '../../components/AppIcon'
import { HostCard } from '../../components/HostCard'
import { HostFilterSheet } from '../../components/HostFilterSheet'
import { HostMap } from '../../components/HostMap'
import { CloseToMeButton } from '../../components/CloseToMeButton'
import { HostSearchBar } from '../../components/HostSearchBar'
import { HostSearchOverlay } from '../../components/HostSearchOverlay'
import { ChoiceChip } from '../../components/ui'
import { VerificationPromptBanner } from '../../components/VerificationPromptBanner'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ACTIVE_REGION_LABEL, getAvailableHosts, WEATHER } from '../../data/mockData'
import {
  countActiveFilters,
  DEFAULT_HOST_FILTERS,
  excludeViewerHostListing,
  filterAndSortHosts,
  getFilterAreas,
  getSearchSuggestions,
  type HostFilters,
  type HostSort,
} from '../../lib/hostFilters'
import { isBelizeFilterArea } from '../../lib/belizeDistricts'
import { canBookOrHost, getIdentityVerification } from '../../lib/identityVerification'
import { toTitleCase } from '../../lib/titleCase'
import type { Host } from '../../types'
import { useTheme } from '../../context/ThemeContext'
import { radius, spacing } from '../../theme'

const SORT_OPTIONS: { value: HostSort; label: string; icon: 'map-pin' | 'dollar-sign' | 'star' | 'clock' }[] = [
  { value: 'nearest', label: 'Nearest', icon: 'map-pin' },
  { value: 'cheapest', label: 'Cheapest', icon: 'dollar-sign' },
  { value: 'rating', label: 'Top Rated', icon: 'star' },
  { value: 'fastest', label: 'Fastest', icon: 'clock' },
]

type SnapPoint = 'map' | 'half' | 'full'

const SNAP_RATIOS: Record<SnapPoint, number> = {
  map: 0.24,
  half: 0.48,
  full: 0.9,
}

const SNAP_ORDER: SnapPoint[] = ['map', 'half', 'full']

function getPopularAreas(): string[] {
  return getFilterAreas()
}

function nearestSnap(height: number, containerHeight: number, velocityY: number): SnapPoint {
  const ratio = height / containerHeight
  if (velocityY > 0.8) {
    if (ratio > SNAP_RATIOS.half) return 'half'
    return 'map'
  }
  if (velocityY < -0.8) {
    if (ratio < SNAP_RATIOS.half) return 'half'
    return 'full'
  }

  let best: SnapPoint = 'half'
  let bestDist = Infinity
  for (const key of SNAP_ORDER) {
    const dist = Math.abs(ratio - SNAP_RATIOS[key])
    if (dist < bestDist) {
      bestDist = dist
      best = key
    }
  }
  return best
}

export function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = useMemo(() => createHomeStyles(colors), [colors])
  const { showToast } = useToast()
  const { user } = useAuth()
  const { viewHostProfile, onlineHosts, allOnlineHosts, refreshHostData, userLocation, requestUserLocation, locationLoading, userLocationLabel, searchRadiusKm, focusSearchOnArea, navigate } = useApp()
  const totalHosts = getAvailableHosts().length
  const isHostViewer = user?.role === 'host'
  const visibleOnlineHosts = useMemo(
    () => excludeViewerHostListing(onlineHosts, user?.role, user?.id),
    [onlineHosts, user?.id, user?.role],
  )
  const visibleAllOnlineHosts = useMemo(
    () => excludeViewerHostListing(allOnlineHosts, user?.role, user?.id),
    [allOnlineHosts, user?.id, user?.role],
  )
  const [filters, setFilters] = useState<HostFilters>(DEFAULT_HOST_FILTERS)
  const [sort, setSort] = useState<HostSort>('nearest')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [containerHeight, setContainerHeight] = useState(0)
  const [snap, setSnap] = useState<SnapPoint>('half')
  const [refreshing, setRefreshing] = useState(false)

  const chevronBounce = useRef(new Animated.Value(0)).current

  const sheetHeight = useRef(new Animated.Value(0)).current
  const dragStartHeight = useRef(0)
  const containerHeightRef = useRef(0)
  const snapRef = useRef<SnapPoint>('half')

  const trimmedSearch = searchQuery.trim()
  const areaSearchActive = trimmedSearch.length > 0 && isBelizeFilterArea(trimmedSearch)
  const hostSource = useMemo(() => {
    if (filters.topRated === 'each-area') return visibleAllOnlineHosts
    if (areaSearchActive) return visibleOnlineHosts
    if (trimmedSearch) return visibleAllOnlineHosts
    return visibleOnlineHosts
  }, [areaSearchActive, filters.topRated, trimmedSearch, visibleAllOnlineHosts, visibleOnlineHosts])

  const nearbyHostIds = useMemo(() => new Set(visibleOnlineHosts.map((h) => h.id)), [visibleOnlineHosts])

  const hosts = useMemo(
    () => filterAndSortHosts(hostSource, filters, sort, searchQuery),
    [hostSource, filters, sort, searchQuery],
  )
  const locations = useMemo(() => getFilterAreas(), [])
  const activeFilterCount = countActiveFilters(filters)
  const popularAreas = useMemo(() => getPopularAreas(), [])

  const areaChips = useMemo(() => {
    if (trimmedSearch) {
      return getSearchSuggestions(visibleAllOnlineHosts, searchQuery, 6)
    }
    return popularAreas
  }, [visibleAllOnlineHosts, searchQuery, trimmedSearch, popularAreas])

  const resultLabel = useMemo(() => {
    if (isHostViewer) {
      if (filters.topRated === 'each-area') {
        return `${hosts.length} host${hosts.length === 1 ? '' : 's'} across Belize · compare pricing`
      }
      if (trimmedSearch) {
        return `${hosts.length} host${hosts.length === 1 ? '' : 's'} for “${trimmedSearch}” · compare pricing`
      }
      return `${hosts.length} within ${searchRadiusKm} km · compare pricing · ${userLocationLabel}`
    }
    if (filters.topRated === 'my-area') {
      return `${hosts.length} top-rated within ${searchRadiusKm} km · ${userLocationLabel}`
    }
    if (filters.topRated === 'each-area') {
      return `${hosts.length} top-rated host${hosts.length === 1 ? '' : 's'} across Belize`
    }
    if (trimmedSearch) {
      return `${hosts.length} host${hosts.length === 1 ? '' : 's'} for “${trimmedSearch}”`
    }
    return `${hosts.length} within ${searchRadiusKm} km · ${userLocationLabel}`
  }, [filters.topRated, hosts.length, isHostViewer, searchRadiusKm, trimmedSearch, userLocationLabel])

  const animateToSnap = useCallback(
    (point: SnapPoint) => {
      const h = containerHeightRef.current
      if (h <= 0) return
      snapRef.current = point
      setSnap(point)
      Animated.spring(sheetHeight, {
        toValue: h * SNAP_RATIOS[point],
        useNativeDriver: false,
        damping: 28,
        stiffness: 280,
        mass: 0.8,
      }).start()
    },
    [sheetHeight],
  )

  useEffect(() => {
    snapRef.current = snap
  }, [snap])

  useEffect(() => {
    if (snap !== 'map') return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(chevronBounce, { toValue: -4, duration: 700, useNativeDriver: true }),
        Animated.timing(chevronBounce, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [snap, chevronBounce])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refreshHostData()
    setRefreshing(false)
  }, [refreshHostData])

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height
    if (h <= 0 || h === containerHeightRef.current) return
    containerHeightRef.current = h
    setContainerHeight(h)
    sheetHeight.setValue(h * SNAP_RATIOS[snapRef.current])
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
        onPanResponderGrant: () => {
          sheetHeight.stopAnimation((v) => {
            dragStartHeight.current = v
          })
        },
        onPanResponderMove: (_, g) => {
          const max = containerHeightRef.current * SNAP_RATIOS.full
          const min = containerHeightRef.current * SNAP_RATIOS.map
          const next = Math.min(max, Math.max(min, dragStartHeight.current - g.dy))
          sheetHeight.setValue(next)
        },
        onPanResponderRelease: (_, g) => {
          sheetHeight.stopAnimation((v) => {
            const target = nearestSnap(v, containerHeightRef.current, g.vy)
            animateToSnap(target)
          })
        },
      }),
    [animateToSnap, sheetHeight],
  )

  const cycleSnap = () => {
    const idx = SNAP_ORDER.indexOf(snapRef.current)
    animateToSnap(SNAP_ORDER[(idx + 1) % SNAP_ORDER.length])
  }

  const clearAll = () => {
    setFilters(DEFAULT_HOST_FILTERS)
    setSearchQuery('')
  }

  const handleCloseToMe = () => {
    void requestUserLocation()
    setSearchQuery('')
    setFilters((prev) => ({ ...prev, location: null }))
    setSort('nearest')
  }

  const openSearch = () => {
    setSearchOpen(true)
    if (snapRef.current === 'map') animateToSnap('half')
  }

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query)
    if (query.trim() && snapRef.current === 'map') animateToSnap('half')
  }

  const selectArea = (area: string) => {
    focusSearchOnArea(area)
    setSearchQuery(area)
    setFilters((prev) => ({ ...prev, location: null }))
    if (snapRef.current === 'map') animateToSnap('half')
  }

  const handleFiltersChange = (next: HostFilters) => {
    setFilters(next)
    if (next.topRated === 'my-area' || next.topRated === 'each-area') {
      setSort('rating')
    }
    if (next.location) {
      focusSearchOnArea(next.location)
      setSearchQuery(next.location)
    }
    showToast('Filters saved', { icon: 'check' })
  }

  const renderHost = useCallback<ListRenderItem<Host>>(
    ({ item }) => <HostCard host={item} />,
    [],
  )

  const showFullControls = snap !== 'map'
  const verification = user ? getIdentityVerification(user) : null
  const showVerificationBanner = !!user && !canBookOrHost(user)

  const listHeader = showFullControls ? (
    <View style={styles.listHeader}>
      {showVerificationBanner && verification ? (
        <VerificationPromptBanner
          role={user!.role}
          status={verification.status}
          onPress={() => navigate('identity-verification')}
        />
      ) : null}
      <Text style={styles.sheetSub}>{resultLabel}</Text>

      {areaChips.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {trimmedSearch ? 'Suggestions' : 'Districts'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            keyboardShouldPersistTaps="handled"
          >
            {areaChips.map((area) => (
              <ChoiceChip
                key={area}
                label={area}
                size="compact"
                selected={trimmedSearch === area || filters.location === area}
                onPress={() => selectArea(area)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{toTitleCase('Sort')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          keyboardShouldPersistTaps="handled"
        >
          {SORT_OPTIONS.map((opt) => (
            <ChoiceChip
              key={opt.value}
              label={opt.label}
              icon={opt.icon}
              size="compact"
              selected={sort === opt.value}
              onPress={() => setSort(opt.value)}
            />
          ))}
          <Pressable style={styles.filterChip} onPress={() => setFiltersOpen(true)}>
            <AppIcon name="sliders" size={14} />
            <Text style={styles.filterChipText}>{toTitleCase('Filters')}</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </ScrollView>
      </View>

      <View style={styles.weatherRow}>
        <AppIcon name="cloud-rain" size={14} color={colors.gray500} />
        <Text style={styles.weatherText} numberOfLines={1}>
          {toTitleCase(WEATHER.headline)}
        </Text>
      </View>

      <View style={styles.resultsDivider}>
        <Text style={styles.resultsTitle}>
          {hosts.length === 0
            ? toTitleCase('No hosts')
            : toTitleCase(`${hosts.length} host${hosts.length === 1 ? '' : 's'}`)}
        </Text>
        {(trimmedSearch || activeFilterCount > 0) && (
          <Pressable onPress={clearAll} hitSlop={8}>
            <Text style={styles.clearLink}>{toTitleCase('Clear All')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  ) : (
    <View style={styles.peekHeader}>
      <Text style={styles.peekText}>
        {hosts.length} host{hosts.length === 1 ? '' : 's'} within {searchRadiusKm} km · swipe up
      </Text>
    </View>
  )

  const listEmpty = (
    <View style={styles.empty}>
      <AppIcon name="search" size={28} color={colors.gray400} />
      <Text style={styles.emptyTitle}>{toTitleCase('No hosts found')}</Text>
      <Text style={styles.emptySub}>
        {trimmedSearch
          ? toTitleCase('Try another area or host name.')
          : visibleOnlineHosts.length === 0 && visibleAllOnlineHosts.length > 0
            ? toTitleCase(
                `No hosts within ${searchRadiusKm} km — check the map for hosts outside your radius.`,
              )
            : visibleOnlineHosts.length === 0
              ? toTitleCase('No hosts are online right now.')
              : toTitleCase('Try different filters or sort.')}
      </Text>
      {!visibleOnlineHosts.length && visibleAllOnlineHosts.length > 0 && (
        <Text style={styles.emptyHint}>
          {visibleAllOnlineHosts.length} host{visibleAllOnlineHosts.length === 1 ? '' : 's'} shown on the map outside your radius
        </Text>
      )}
      {!visibleAllOnlineHosts.length && totalHosts > 0 && (
        <Text style={styles.emptyHint}>
          {totalHosts} host{totalHosts === 1 ? '' : 's'} offline across {ACTIVE_REGION_LABEL}
        </Text>
      )}
    </View>
  )

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <View style={styles.map} pointerEvents="box-none">
        <HostMap
          hosts={visibleAllOnlineHosts}
          nearbyHostIds={nearbyHostIds}
          onHostPress={viewHostProfile}
          userLocation={userLocation}
          radiusKm={searchRadiusKm}
          fitToResults={!!trimmedSearch && !isBelizeFilterArea(trimmedSearch)}
          fitToHosts={trimmedSearch && !isBelizeFilterArea(trimmedSearch) ? hosts : undefined}
        />
        {snap !== 'full' && hosts.length > 0 && (
          <View style={styles.mapBadgeWrap} pointerEvents="box-none">
            <Pressable style={styles.mapBadge} onPress={() => animateToSnap('half')}>
              <AppIcon name="map-pin" size={14} color={colors.white} />
              <Text style={styles.mapBadgeText}>
                {hosts.length} within {searchRadiusKm} km
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <Animated.View
        style={[
          styles.sheet,
          containerHeight > 0 && { height: sheetHeight },
        ]}
      >
        <View style={styles.dragZone} {...panResponder.panHandlers}>
          <Pressable onPress={cycleSnap} style={styles.handleTouch} hitSlop={12}>
            <View style={styles.handle} />
          </Pressable>
          <View style={styles.sheetTitleRow}>
            <Text style={styles.sheetTitle}>{toTitleCase('Select A Host')}</Text>
          <Pressable onPress={cycleSnap} hitSlop={8} style={styles.snapBtn}>
            <Animated.View style={{ transform: [{ translateY: snap === 'map' ? chevronBounce : 0 }] }}>
              <AppIcon
                name={snap === 'map' ? 'chevron-up' : snap === 'full' ? 'chevron-down' : 'maximize-2'}
                size={18}
                color={colors.gray500}
              />
            </Animated.View>
          </Pressable>
          </View>
        </View>

        <Pressable onPress={openSearch}>
          <View pointerEvents="none">
            <HostSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search area, town, or host"
              editable={false}
            />
          </View>
        </Pressable>
        <CloseToMeButton
          onPress={handleCloseToMe}
          loading={locationLoading}
          locationLabel={userLocationLabel}
        />

        <FlatList
          data={hosts}
          keyExtractor={(item) => item.id}
          renderItem={renderHost}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.black} />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          scrollEnabled={snap !== 'map'}
        />
      </Animated.View>

      <HostFilterSheet
        visible={filtersOpen}
        filters={filters}
        locations={locations}
        onSave={handleFiltersChange}
        onClose={() => setFiltersOpen(false)}
      />

      <HostSearchOverlay
        visible={searchOpen}
        initialQuery={searchQuery}
        sort={sort}
        onClose={() => setSearchOpen(false)}
        onQueryChange={handleSearchQueryChange}
      />
    </View>
  )
}

function createHomeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mapBg },
  map: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  mapBadgeWrap: {
    position: 'absolute',
    top: spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.black,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  mapBadgeText: { fontSize: 13, fontWeight: '600', color: colors.white },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.screen,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  dragZone: { paddingTop: spacing.sm },
  handleTouch: { alignItems: 'center', paddingBottom: spacing.sm },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.gray200,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    letterSpacing: -0.3,
  },
  snapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSub: {
    fontSize: 13,
    color: colors.gray500,
    marginBottom: spacing.sm,
  },
  peekHeader: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    marginBottom: spacing.sm,
  },
  peekText: { fontSize: 13, color: colors.gray500, fontWeight: '500', textAlign: 'center' },
  listHeader: { gap: 0 },
  section: { marginBottom: spacing.sm },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray400,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  chipRow: { gap: 8, paddingRight: spacing.sm },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 34,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  filterChipText: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  filterBadge: {
    backgroundColor: colors.black,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: { fontSize: 9, fontWeight: '700', color: colors.white },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
    paddingVertical: 4,
  },
  weatherText: { flex: 1, fontSize: 12, color: colors.gray500, fontWeight: '500' },
  resultsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    marginBottom: spacing.sm,
  },
  resultsTitle: { fontSize: 15, fontWeight: '700', color: colors.black },
  clearLink: { fontSize: 13, fontWeight: '600', color: colors.black, textDecorationLine: 'underline' },
  listContent: { flexGrow: 1 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm, paddingHorizontal: spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.black },
  emptySub: { fontSize: 14, color: colors.gray500, textAlign: 'center', lineHeight: 20 },
  emptyHint: { fontSize: 12, color: colors.gray400, textAlign: 'center' },
  })
}
