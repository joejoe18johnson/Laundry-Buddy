import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { HostCard } from '../../components/HostCard'
import { HostFilterSheet } from '../../components/HostFilterSheet'
import { HostSearchBar } from '../../components/HostSearchBar'
import { WeatherBanner } from '../../components/WeatherBanner'
import { useApp } from '../../context/AppContext'
import { ACTIVE_REGION_LABEL, getAvailableHosts } from '../../data/mockData'
import {
  countActiveFilters,
  DEFAULT_HOST_FILTERS,
  filterAndSortHosts,
  getHostLocations,
  getSearchSuggestions,
  type HostFilters,
  type HostSort,
} from '../../lib/hostFilters'
import { colors, radius, spacing } from '../../theme'

const SORT_OPTIONS: { value: HostSort; label: string; icon: 'map-pin' | 'dollar-sign' | 'star' | 'clock' }[] = [
  { value: 'nearest', label: 'Nearest', icon: 'map-pin' },
  { value: 'cheapest', label: 'Cheapest', icon: 'dollar-sign' },
  { value: 'rating', label: 'Top rated', icon: 'star' },
  { value: 'fastest', label: 'Fastest', icon: 'clock' },
]

export function HomeScreen() {
  const { viewHostProfile, onlineHosts } = useApp()
  const allHosts = onlineHosts
  const totalHosts = getAvailableHosts().length
  const [filters, setFilters] = useState<HostFilters>(DEFAULT_HOST_FILTERS)
  const [sort, setSort] = useState<HostSort>('nearest')
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const hosts = useMemo(
    () => filterAndSortHosts(allHosts, filters, sort, searchQuery),
    [allHosts, filters, sort, searchQuery],
  )
  const locations = useMemo(() => getHostLocations(allHosts), [allHosts])
  const areaSuggestions = useMemo(
    () => getSearchSuggestions(allHosts, searchQuery),
    [allHosts, searchQuery],
  )
  const activeFilterCount = countActiveFilters(filters)
  const trimmedSearch = searchQuery.trim()

  const subtitle = trimmedSearch
    ? `${hosts.length} host${hosts.length === 1 ? '' : 's'} matching “${trimmedSearch}”`
    : sort === 'nearest'
      ? `${hosts.length} online · closest first`
      : `${hosts.length} of ${totalHosts} online in ${ACTIVE_REGION_LABEL}`

  const clearAll = () => {
    setFilters(DEFAULT_HOST_FILTERS)
    setSearchQuery('')
  }

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <View style={styles.mapGrid} />
        <View style={styles.youDot}>
          <View style={styles.youInner} />
        </View>
        {hosts.length === 0 ? (
          <View style={styles.mapEmpty}>
            <AppIcon name="map-pin" size={20} color={colors.gray400} />
            <Text style={styles.mapEmptyText}>No hosts in this area</Text>
          </View>
        ) : (
          hosts.slice(0, 6).map((host, i) => (
            <Pressable
              key={host.id}
              style={[styles.pin, pinPositions[i % pinPositions.length]]}
              onPress={() => viewHostProfile(host)}
            >
              <Text style={styles.pinPrice}>{host.price <= 0 ? 'Free' : `$${host.price}`}</Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Select a host</Text>
        <Text style={styles.sheetSub}>{subtitle}</Text>

        <HostSearchBar value={searchQuery} onChange={setSearchQuery} />

        {areaSuggestions.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            keyboardShouldPersistTaps="handled"
          >
            {areaSuggestions.map((area) => (
              <Pressable
                key={area}
                onPress={() => setSearchQuery(area)}
                style={[styles.chip, trimmedSearch === area && styles.chipActive]}
              >
                <AppIcon
                  name="map-pin"
                  size={12}
                  color={trimmedSearch === area ? colors.white : colors.gray600}
                />
                <Text style={[styles.chipText, trimmedSearch === area && styles.chipTextActive]}>
                  {area}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <WeatherBanner />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.sortScroll}
        >
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setSort(opt.value)}
              style={[styles.chip, sort === opt.value && styles.chipActive]}
            >
              <AppIcon
                name={opt.icon}
                size={14}
                color={sort === opt.value ? colors.white : colors.gray600}
              />
              <Text style={[styles.chipText, sort === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
          <Pressable style={styles.filterChip} onPress={() => setFiltersOpen(true)}>
            <AppIcon name="sliders" size={14} />
            <Text style={styles.chipText}>Filters</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </ScrollView>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {hosts.length === 0 ? (
            <View style={styles.empty}>
              <AppIcon name="search" size={28} color={colors.gray400} />
              <Text style={styles.emptyTitle}>No hosts found</Text>
              <Text style={styles.emptySub}>
                {trimmedSearch
                  ? 'Try a different area or host name.'
                  : allHosts.length === 0
                    ? 'No hosts are online right now. Check back soon.'
                    : 'Try adjusting your filters or sort order.'}
              </Text>
              <Pressable style={styles.clearBtn} onPress={clearAll}>
                <Text style={styles.clearBtnText}>Clear search & filters</Text>
              </Pressable>
            </View>
          ) : (
            hosts.map((host) => <HostCard key={host.id} host={host} />)
          )}
        </ScrollView>
      </View>

      <HostFilterSheet
        visible={filtersOpen}
        filters={filters}
        locations={locations}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </View>
  )
}

const pinPositions = [
  { top: '18%' as const, left: '14%' as const },
  { top: '42%' as const, right: '12%' as const },
  { top: '58%' as const, left: '24%' as const },
  { top: '28%' as const, right: '28%' as const },
  { top: '68%' as const, right: '36%' as const },
  { top: '36%' as const, left: '42%' as const },
]

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mapBg },
  map: {
    flex: 0.34,
    minHeight: 150,
    backgroundColor: colors.mapBg,
    position: 'relative',
    overflow: 'hidden',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    margin: spacing.lg,
    borderRadius: radius.lg,
  },
  youDot: {
    position: 'absolute',
    top: '46%',
    left: '48%',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(39, 110, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  youInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: colors.white,
  },
  mapEmpty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  mapEmptyText: { fontSize: 13, color: colors.gray500, fontWeight: '500' },
  pin: {
    position: 'absolute',
    backgroundColor: colors.black,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  pinPrice: { fontSize: 13, fontWeight: '700', color: colors.white },
  sheet: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    marginTop: -spacing.lg,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.black,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 14,
    color: colors.gray500,
    marginBottom: spacing.md,
  },
  chipRow: { gap: spacing.sm, paddingBottom: spacing.sm },
  sortScroll: { marginBottom: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gray50,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: { backgroundColor: colors.black },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  chipTextActive: { color: colors.white },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  filterBadge: {
    backgroundColor: colors.black,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: colors.white },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.black },
  emptySub: { fontSize: 14, color: colors.gray500, textAlign: 'center', lineHeight: 20 },
  clearBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.gray50,
  },
  clearBtnText: { fontSize: 14, fontWeight: '600', color: colors.black },
})
