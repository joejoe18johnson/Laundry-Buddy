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
        <View style={styles.iconCircle}>
          <AppIcon name="map-pin" size={22} color={colors.white} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.cardTitle}>Your search area</Text>
          <Text style={styles.cardSub}>Hosts shown within your radius</Text>
        </View>
      </View>

      <View style={styles.currentRow}>
        <AppIcon name="navigation" size={16} color={colors.black} />
        <Text style={styles.currentLabel} numberOfLines={1}>
          {locationLabel}
        </Text>
        <View style={styles.radiusPill}>
          <Text style={styles.radiusPillText}>{radiusKm} km</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.gpsBtn, pressed && styles.gpsBtnPressed]}
        onPress={onUseGps}
        disabled={locating}
      >
        {locating ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <AppIcon name="crosshair" size={18} color={colors.black} />
        )}
        <Text style={styles.gpsBtnText}>{locating ? 'Finding you…' : 'Use my GPS location'}</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Or pick an area</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {LOCATION_PRESETS.map((preset) => {
          const selected = locationLabel === preset.label
          return (
            <Pressable
              key={preset.label}
              onPress={() => onSelectPreset(preset.label, preset.latitude, preset.longitude)}
              style={[styles.areaChip, selected && styles.areaChipSelected]}
            >
              <Text style={[styles.areaChipText, selected && styles.areaChipTextSelected]}>
                {preset.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <Text style={styles.sectionLabel}>Search radius</Text>
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
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.black,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.white },
  cardSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  currentLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.black },
  radiusPill: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  radiusPillText: { fontSize: 12, fontWeight: '700', color: colors.black },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: 14,
  },
  gpsBtnPressed: { opacity: 0.9 },
  gpsBtnText: { fontSize: 15, fontWeight: '700', color: colors.black },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  chipRow: { gap: spacing.sm, paddingVertical: 4 },
  areaChip: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  areaChipSelected: { backgroundColor: colors.white, borderColor: colors.white },
  areaChipText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  areaChipTextSelected: { color: colors.black },
  radiusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingBottom: 4 },
  radiusChip: {
    flex: 1,
    minWidth: 52,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: radius.md,
    paddingVertical: 10,
  },
  radiusChipSelected: { backgroundColor: colors.white, borderColor: colors.white },
  radiusChipText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  radiusChipTextSelected: { color: colors.black },
})
