import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { LOCATION_PRESETS, RADIUS_OPTIONS_KM, type RadiusOptionKm } from '../lib/locationPreferences'
import { colors, radius, spacing } from '../theme'

type Props = {
  locationLabel: string
  radiusKm: number
  locating: boolean
  onUseGps: () => void
  onSelectPreset: (label: string, latitude: number, longitude: number) => void
  onSelectRadius: (km: RadiusOptionKm) => void
}

export function LocationPreferencesCard({
  locationLabel,
  radiusKm,
  locating,
  onUseGps,
  onSelectPreset,
  onSelectRadius,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <AppIcon name="map-pin" size={18} color={colors.gray600} />
        <View style={styles.headerText}>
          <Text style={styles.cardTitle}>Search area</Text>
          <Text style={styles.cardSub}>Hosts shown within your radius on the map</Text>
        </View>
      </View>

      <View style={styles.currentRow}>
        <AppIcon name="navigation" size={15} color={colors.gray500} />
        <Text style={styles.currentLabel} numberOfLines={1}>
          {locationLabel}
        </Text>
        <Text style={styles.radiusMeta}>{radiusKm} km</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.gpsBtn, pressed && styles.gpsBtnPressed]}
        onPress={onUseGps}
        disabled={locating}
      >
        {locating ? (
          <ActivityIndicator color={colors.black} size="small" />
        ) : (
          <AppIcon name="crosshair" size={16} color={colors.black} />
        )}
        <Text style={styles.gpsBtnText}>{locating ? 'Finding you…' : 'Use my location'}</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Areas</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {LOCATION_PRESETS.map((preset) => {
          const selected = locationLabel === preset.label
          return (
            <Pressable
              key={preset.label}
              onPress={() => onSelectPreset(preset.label, preset.latitude, preset.longitude)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{preset.label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <Text style={styles.sectionLabel}>Radius</Text>
      <View style={styles.radiusRow}>
        {RADIUS_OPTIONS_KM.map((km) => {
          const selected = radiusKm === km
          return (
            <Pressable
              key={km}
              onPress={() => onSelectRadius(km)}
              style={[styles.radiusChip, selected && styles.radiusChipSelected]}
            >
              <Text style={[styles.radiusChipText, selected && styles.radiusChipTextSelected]}>
                {km} km
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.gray50,
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.black },
  cardSub: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  currentLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.black },
  radiusMeta: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingVertical: 12,
  },
  gpsBtnPressed: { backgroundColor: colors.gray50 },
  gpsBtnText: { fontSize: 14, fontWeight: '600', color: colors.black },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray400,
    textTransform: 'capitalize',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  chipRow: { gap: 8, paddingVertical: 4 },
  chip: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipSelected: { borderColor: colors.black, backgroundColor: colors.black },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  chipTextSelected: { color: colors.white },
  radiusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 },
  radiusChip: {
    flex: 1,
    minWidth: 52,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  radiusChipSelected: { borderColor: colors.black, backgroundColor: colors.black },
  radiusChipText: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  radiusChipTextSelected: { color: colors.white },
})
