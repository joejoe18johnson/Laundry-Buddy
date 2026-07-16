import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import { LocationPreferencesCard } from './LocationPreferencesCard'
import { SaveFooter } from './ui'
import { FILTER_AREA_RADIUS_KM, getFilterAreaCenter } from '../lib/belizeDistricts'
import type { Coordinates } from '../lib/geo'
import {
  locationPreferencesEqual,
  type LocationPreferences,
  type RadiusOptionKm,
} from '../lib/locationPreferences'
import { colors, spacing } from '../theme'

type Props = {
  visible: boolean
  saved: LocationPreferences
  locating: boolean
  onClose: () => void
  onSave: (prefs: LocationPreferences) => void
  onFetchGps: () => Promise<Coordinates | null>
}

export function LocationSettingsSheet({
  visible,
  saved,
  locating,
  onClose,
  onSave,
  onFetchGps,
}: Props) {
  const [draft, setDraft] = useState<LocationPreferences>(saved)

  useEffect(() => {
    if (visible) setDraft(saved)
  }, [visible, saved])

  const dirty = useMemo(() => !locationPreferencesEqual(draft, saved), [draft, saved])

  const selectArea = (area: string) => {
    const center = getFilterAreaCenter(area)
    if (!center) return
    setDraft({
      userLocation: { latitude: center.latitude, longitude: center.longitude },
      userLocationLabel: center.label,
      searchRadiusKm: FILTER_AREA_RADIUS_KM as RadiusOptionKm,
    })
  }

  const selectRadius = (km: RadiusOptionKm) => {
    setDraft((prev) => ({ ...prev, searchRadiusKm: km }))
  }

  const useGps = async () => {
    const coords = await onFetchGps()
    if (!coords) return
    setDraft((prev) => ({
      ...prev,
      userLocation: coords,
      userLocationLabel: 'Your location',
    }))
  }

  const handleSave = () => {
    onSave({
      userLocation: draft.userLocation,
      userLocationLabel: draft.userLocationLabel,
      searchRadiusKm: draft.searchRadiusKm as RadiusOptionKm,
    })
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <AppIcon name="x" size={22} color={colors.black} />
          </Pressable>
          <Text style={styles.title}>Location Settings</Text>
          <View style={styles.closeBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LocationPreferencesCard
            variant="screen"
            locationLabel={draft.userLocationLabel}
            radiusKm={draft.searchRadiusKm}
            locating={locating}
            dirty={dirty}
            onUseGps={() => void useGps()}
            onSelectArea={selectArea}
            onSelectRadius={selectRadius}
          />
        </ScrollView>

        <View style={styles.footer}>
          <SaveFooter
            dirty={dirty}
            onSave={handleSave}
            saveLabel="Save search area"
            savedLabel="Search area saved"
            dirtyHint="Choose an area and radius, then save to update the map"
          />
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  closeBtn: {
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
  scroll: { flex: 1 },
  content: {
    padding: spacing.screen,
    paddingBottom: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
})
