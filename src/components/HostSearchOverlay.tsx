import { useEffect, useMemo, useState } from 'react'
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import { HostAvatar } from './HostAvatar'
import { CloseToMeButton } from './CloseToMeButton'
import { HostSearchBar } from './HostSearchBar'
import { ChoiceChip } from './ui'
import { useApp } from '../context/AppContext'
import { BELIZE_FILTER_AREAS, isBelizeFilterArea } from '../lib/belizeDistricts'
import {
  DEFAULT_HOST_FILTERS,
  filterAndSortHosts,
  formatHostPrice,
  getSearchSuggestionItems,
  type HostSort,
  type SearchSuggestion,
} from '../lib/hostFilters'
import type { Host } from '../types'
import { colors, radius, spacing } from '../theme'

type Props = {
  visible: boolean
  initialQuery?: string
  sort: HostSort
  onClose: () => void
  onQueryChange?: (query: string) => void
}

function HostSearchRow({
  host,
  outsideRadius,
  onPress,
}: {
  host: Host
  outsideRadius: boolean
  onPress: () => void
}) {
  const isFree = host.price <= 0

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      <HostAvatar host={host} size={44} />
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {host.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {host.location}
          {host.district ? ` · ${host.district}` : ''}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {host.rating > 0 ? `★ ${host.rating.toFixed(1)}` : 'New host'}
          {' · '}
          {host.distanceKm != null ? `${host.distanceKm} km away` : 'Nearby'}
          {outsideRadius ? ' · Outside radius' : ''}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowPrice, isFree && styles.rowPriceFree]}>{formatHostPrice(host.price)}</Text>
        <AppIcon name="chevron-right" size={18} color={colors.gray400} />
      </View>
    </Pressable>
  )
}

function SuggestionRow({
  item,
  onPress,
}: {
  item: SearchSuggestion
  onPress: () => void
}) {
  if (item.type === 'host') {
    return (
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
        <HostAvatar host={item.host} size={40} />
        <View style={styles.rowBody}>
          <Text style={styles.rowName}>{item.label}</Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {item.host.location}
            {item.host.district ? ` · ${item.host.district}` : ''}
          </Text>
        </View>
        <AppIcon name="search" size={16} color={colors.gray400} />
      </Pressable>
    )
  }

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      <View style={styles.placeIcon}>
        <AppIcon name="map-pin" size={18} color={colors.black} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>{item.label}</Text>
        <Text style={styles.rowMeta}>Belize district</Text>
      </View>
      <AppIcon name="chevron-right" size={18} color={colors.gray400} />
    </Pressable>
  )
}

export function HostSearchOverlay({ visible, initialQuery = '', sort, onClose, onQueryChange }: Props) {
  const { allOnlineHosts, onlineHosts, viewHostProfile, requestUserLocation, locationLoading, userLocationLabel, focusSearchOnArea, searchRadiusKm } =
    useApp()
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    if (visible) setQuery(initialQuery)
  }, [visible, initialQuery])

  const trimmed = query.trim()
  const areaSearchActive = trimmed.length > 0 && isBelizeFilterArea(trimmed)
  const nearbyIds = useMemo(() => new Set(onlineHosts.map((h) => h.id)), [onlineHosts])

  const results = useMemo(
    () => filterAndSortHosts(areaSearchActive ? onlineHosts : allOnlineHosts, DEFAULT_HOST_FILTERS, sort, query),
    [allOnlineHosts, areaSearchActive, onlineHosts, sort, query],
  )

  const suggestions = useMemo(
    () => getSearchSuggestionItems(allOnlineHosts, query, 6),
    [allOnlineHosts, query],
  )

  const handleQueryChange = (value: string) => {
    setQuery(value)
    onQueryChange?.(value)
  }

  const handleCloseToMe = () => {
    void requestUserLocation()
    handleQueryChange('')
  }

  const openHost = (host: Host) => {
    Keyboard.dismiss()
    onClose()
    viewHostProfile(host)
  }

  const applySuggestion = (item: SearchSuggestion) => {
    if (item.type === 'host') {
      openHost(item.host)
      return
    }
    if (isBelizeFilterArea(item.label)) {
      focusSearchOnArea(item.label)
    }
    handleQueryChange(item.label)
  }

  const selectFilterArea = (area: string) => {
    focusSearchOnArea(area)
    handleQueryChange(area)
  }

  const renderResult: ListRenderItem<Host> = ({ item }) => (
    <HostSearchRow
      host={item}
      outsideRadius={!nearbyIds.has(item.id)}
      onPress={() => openHost(item)}
    />
  )

  const listHeader = (
    <View style={styles.headerBlock}>
      {!trimmed && suggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Suggestions</Text>
          {suggestions.map((item) => (
            <SuggestionRow
              key={item.type === 'host' ? item.host.id : item.label}
              item={item}
              onPress={() => applySuggestion(item)}
            />
          ))}
        </View>
      )}

      {trimmed && suggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Matches</Text>
          {suggestions.map((item) => (
            <SuggestionRow
              key={item.type === 'host' ? item.host.id : item.label}
              item={item}
              onPress={() => applySuggestion(item)}
            />
          ))}
        </View>
      )}

      <View style={styles.districtSection}>
        <Text style={styles.sectionLabelInline}>Areas</Text>
        <View style={styles.quickAreas}>
          {BELIZE_FILTER_AREAS.map((area) => (
            <ChoiceChip
              key={area}
              label={area}
              size="compact"
              selected={trimmed.toLowerCase() === area.toLowerCase()}
              onPress={() => selectFilterArea(area)}
            />
          ))}
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {trimmed
            ? `${results.length} result${results.length === 1 ? '' : 's'} for “${trimmed}”`
            : `${results.length} hosts nearby`}
        </Text>
        <Text style={styles.resultsSub}>
          {trimmed
            ? areaSearchActive
              ? `Hosts within ${searchRadiusKm} km of ${trimmed}`
              : 'Searching all online hosts — includes towns outside your radius'
            : 'Pick an area or search by host name and town'}
        </Text>
      </View>
    </View>
  )

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.backBtn}>
            <AppIcon name="arrow-left" size={22} color={colors.black} />
          </Pressable>
          <Text style={styles.title}>Search hosts</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.searchWrap}>
          <HostSearchBar
            value={query}
            onChange={handleQueryChange}
            placeholder="Name, town, or area"
            autoFocus
          />
          <CloseToMeButton
            onPress={handleCloseToMe}
            loading={locationLoading}
            locationLabel={userLocationLabel}
          />
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderResult}
          ListHeaderComponent={listHeader}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AppIcon name="search" size={28} color={colors.gray400} />
              <Text style={styles.emptyTitle}>No hosts found</Text>
              <Text style={styles.emptySub}>
                Try a host name like Maria, or pick a district like Cayo or Orange Walk.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.black,
  },
  searchWrap: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
  },
  headerBlock: { paddingBottom: spacing.sm },
  section: { marginBottom: spacing.md },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray400,
    textTransform: 'capitalize',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.screen,
  },
  districtSection: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.screen,
  },
  sectionLabelInline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray400,
    textTransform: 'capitalize',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  resultsHeader: {
    paddingHorizontal: spacing.screen,
    marginBottom: spacing.sm,
    gap: 4,
  },
  resultsTitle: { fontSize: 16, fontWeight: '700', color: colors.black },
  resultsSub: { fontSize: 13, color: colors.gray500 },
  quickAreas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  rowPressed: { backgroundColor: colors.gray50 },
  rowBody: { flex: 1, minWidth: 0, gap: 2 },
  rowName: { fontSize: 16, fontWeight: '700', color: colors.black },
  rowMeta: { fontSize: 13, color: colors.gray600, fontWeight: '500' },
  rowSub: { fontSize: 12, color: colors.gray500 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowPrice: { fontSize: 15, fontWeight: '700', color: colors.black },
  rowPriceFree: { color: colors.green },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.gray75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.black },
  emptySub: { fontSize: 14, color: colors.gray500, textAlign: 'center', lineHeight: 20 },
})
