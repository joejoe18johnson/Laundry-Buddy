import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { HostCard } from '../../components/HostCard'
import { HostFilterSheet } from '../../components/HostFilterSheet'
import { HostSearchBar } from '../../components/HostSearchBar'
import { WeatherBanner } from '../../components/WeatherBanner'
import { Screen } from '../../components/ui'
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
  const { showMap, setShowMap, viewHostProfile, onlineHosts } = useApp()
  const allHosts = onlineHosts
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
      ? `${hosts.length} hosts · closest to you first`
      : `${hosts.length} of ${allHosts.length} hosts in ${ACTIVE_REGION_LABEL}`

  const clearAll = () => {
    setFilters(DEFAULT_HOST_FILTERS)
    setSearchQuery('')
  }

  return (
    <Screen>
      <Text style={styles.title}>Find a dryer near you</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <HostSearchBar value={searchQuery} onChange={setSearchQuery} />

      {areaSuggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.areaRow}
          style={styles.areaScroll}
          keyboardShouldPersistTaps="handled"
        >
          {areaSuggestions.map((area) => (
            <Pressable
              key={area}
              onPress={() => setSearchQuery(area)}
              style={[styles.areaChip, trimmedSearch === area && styles.areaChipActive]}
            >
              <AppIcon
                name="map-pin"
                size={12}
                color={trimmedSearch === area ? colors.white : colors.gray600}
              />
              <Text style={[styles.areaText, trimmedSearch === area && styles.areaTextActive]}>
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
        contentContainerStyle={styles.sortRow}
        style={styles.sortScroll}
      >
        {SORT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setSort(opt.value)}
            style={[styles.sortChip, sort === opt.value && styles.sortChipActive]}
          >
            <AppIcon
              name={opt.icon}
              size={14}
              color={sort === opt.value ? colors.white : colors.gray600}
            />
            <Text style={[styles.sortText, sort === opt.value && styles.sortTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.toolbar}>
        <Pressable style={styles.toolBtn} onPress={() => setFiltersOpen(true)}>
          <AppIcon name="sliders" size={16} />
          <Text style={styles.toolText}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={() => setShowMap(!showMap)}>
          <AppIcon name={showMap ? 'list' : 'map'} size={16} />
          <Text style={styles.toolText}>{showMap ? 'List' : 'Map'}</Text>
        </Pressable>
      </View>

      {showMap ? (
        <View style={styles.map}>
          {hosts.length === 0 ? (
            <View style={styles.emptyMap}>
              <AppIcon name="search" size={28} color={colors.gray400} />
              <Text style={styles.emptyText}>No hosts match your filters</Text>
              <Pressable onPress={clearAll}>
                <Text style={styles.emptyLink}>Clear search & filters</Text>
              </Pressable>
            </View>
          ) : (
            hosts.map((host, i) => (
              <Pressable
                key={host.id}
                style={[styles.pin, pinPositions[i % 4]]}
                onPress={() => viewHostProfile(host)}
              >
                <Text style={styles.pinPrice}>{host.price <= 0 ? 'Free' : `$${host.price}`}</Text>
                <Text style={styles.pinName}>{host.name}</Text>
                <Text style={styles.pinMeta}>
                  {host.turnaroundHours} hr · {host.distanceKm} km
                </Text>
              </Pressable>
            ))
          )}
        </View>
      ) : hosts.length === 0 ? (
        <View style={styles.emptyList}>
          <AppIcon name="search" size={32} color={colors.gray400} />
          <Text style={styles.emptyTitle}>No hosts found</Text>
          <Text style={styles.emptySub}>
            {trimmedSearch
              ? 'Try a different area or host name.'
              : 'Try adjusting your filters or sort order.'}
          </Text>
          <Pressable style={styles.clearBtn} onPress={clearAll}>
            <Text style={styles.clearBtnText}>Clear search & filters</Text>
          </Pressable>
        </View>
      ) : (
        hosts.map((host) => <HostCard key={host.id} host={host} />)
      )}

      <HostFilterSheet
        visible={filtersOpen}
        filters={filters}
        locations={locations}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </Screen>
  )
}

const pinPositions = [
  { top: '22%' as const, left: '18%' as const },
  { top: '48%' as const, right: '16%' as const },
  { top: '62%' as const, left: '28%' as const },
  { top: '32%' as const, right: '32%' as const },
]

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', marginBottom: spacing.sm, lineHeight: 32 },
  subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.md, lineHeight: 22 },
  areaScroll: { marginHorizontal: -spacing.screen, marginBottom: spacing.md },
  areaRow: { paddingHorizontal: spacing.screen, gap: spacing.sm },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  areaChipActive: { backgroundColor: colors.black, borderColor: colors.black },
  areaText: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  areaTextActive: { color: colors.white },
  sortScroll: { marginHorizontal: -spacing.screen, marginBottom: spacing.md },
  sortRow: { paddingHorizontal: spacing.screen, gap: spacing.sm },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortChipActive: { backgroundColor: colors.black, borderColor: colors.black },
  sortText: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  sortTextActive: { color: colors.white },
  toolbar: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  toolText: { fontSize: 13, fontWeight: '600' },
  filterBadge: {
    backgroundColor: colors.accent,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: colors.white },
  map: {
    height: 340,
    backgroundColor: colors.gray50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    position: 'relative',
  },
  pin: {
    position: 'absolute',
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: 2,
    minWidth: 88,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  pinPrice: { fontSize: 15, fontWeight: '700', color: colors.black },
  pinName: { fontSize: 12, fontWeight: '600', color: colors.gray600 },
  pinMeta: { fontSize: 11, color: colors.gray400 },
  emptyMap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyList: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySub: { fontSize: 14, color: colors.gray500, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.gray500 },
  emptyLink: { fontSize: 14, fontWeight: '600', color: colors.accent },
  clearBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  clearBtnText: { fontSize: 14, fontWeight: '600' },
})
