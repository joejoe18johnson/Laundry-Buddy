import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  DEFAULT_HOST_FILTERS,
  type HostFilters,
} from '../lib/hostFilters'
import { colors, radius, spacing } from '../theme'
import { AppIcon } from './AppIcon'
import { ChoiceChip } from './ui'

type Props = {
  visible: boolean
  filters: HostFilters
  locations: string[]
  onSave: (filters: HostFilters) => void
  onClose: () => void
}

function FilterSection({ title, icon, children }: { title: string; icon: 'map-pin' | 'dollar-sign' | 'star' | 'clock'; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppIcon name={icon} size={16} color={colors.gray600} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.chipRow}>{children}</View>
    </View>
  )
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <ChoiceChip label={label} selected={selected} onPress={onPress} variant="outline" />
  )
}

function filtersEqual(a: HostFilters, b: HostFilters): boolean {
  return (
    a.location === b.location &&
    a.maxPrice === b.maxPrice &&
    a.minRating === b.minRating &&
    a.maxDryHours === b.maxDryHours
  )
}

export function HostFilterSheet({ visible, filters, locations, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<HostFilters>(filters)

  useEffect(() => {
    if (visible) setDraft(filters)
  }, [visible, filters])

  const dirty = useMemo(() => !filtersEqual(draft, filters), [draft, filters])

  const set = (patch: Partial<HostFilters>) => setDraft((prev) => ({ ...prev, ...patch }))

  const handleSave = () => {
    onSave(draft)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>Filter hosts</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <AppIcon name="x" size={22} color={colors.gray500} />
              </Pressable>
            </View>

            <Text style={styles.hint}>
              {dirty ? 'Tap Save filters when you are done' : 'Adjust filters, then save to apply'}
            </Text>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <FilterSection title="Location" icon="map-pin">
                <Chip
                  label="All areas"
                  selected={draft.location === null}
                  onPress={() => set({ location: null })}
                />
                {locations.map((loc) => (
                  <Chip
                    key={loc}
                    label={loc}
                    selected={draft.location === loc}
                    onPress={() => set({ location: loc })}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Price per load" icon="dollar-sign">
                <Chip label="Any" selected={draft.maxPrice === null} onPress={() => set({ maxPrice: null })} />
                <Chip label="Free" selected={draft.maxPrice === 0} onPress={() => set({ maxPrice: 0 })} />
                <Chip label="Up to $3" selected={draft.maxPrice === 3} onPress={() => set({ maxPrice: 3 })} />
                <Chip label="Up to $5" selected={draft.maxPrice === 5} onPress={() => set({ maxPrice: 5 })} />
                <Chip label="Up to $8" selected={draft.maxPrice === 8} onPress={() => set({ maxPrice: 8 })} />
              </FilterSection>

              <FilterSection title="Reviews" icon="star">
                <Chip label="Any" selected={draft.minRating === null} onPress={() => set({ minRating: null })} />
                <Chip label="4.0+" selected={draft.minRating === 4} onPress={() => set({ minRating: 4 })} />
                <Chip label="4.5+" selected={draft.minRating === 4.5} onPress={() => set({ minRating: 4.5 })} />
                <Chip label="4.8+" selected={draft.minRating === 4.8} onPress={() => set({ minRating: 4.8 })} />
              </FilterSection>

              <FilterSection title="Dry time (standard load)" icon="clock">
                <Chip label="Any" selected={draft.maxDryHours === null} onPress={() => set({ maxDryHours: null })} />
                <Chip label="Under 3 hr" selected={draft.maxDryHours === 3} onPress={() => set({ maxDryHours: 3 })} />
                <Chip label="Under 4 hr" selected={draft.maxDryHours === 4} onPress={() => set({ maxDryHours: 4 })} />
                <Chip label="Under 5 hr" selected={draft.maxDryHours === 5} onPress={() => set({ maxDryHours: 5 })} />
              </FilterSection>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                style={styles.resetBtn}
                onPress={() => setDraft(DEFAULT_HOST_FILTERS)}
              >
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
              <Pressable
                style={[styles.applyBtn, !dirty && styles.applyBtnSaved]}
                onPress={handleSave}
              >
                <Text style={styles.applyText}>{dirty ? 'Save filters' : 'Saved'}</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: { fontSize: 20, fontWeight: '700' },
  hint: {
    fontSize: 13,
    color: colors.gray500,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    lineHeight: 18,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.gray600, textTransform: 'capitalize', letterSpacing: 0.4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  resetText: { fontSize: 16, fontWeight: '600' },
  applyBtn: {
    flex: 2,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.black,
  },
  applyBtnSaved: {
    backgroundColor: colors.green,
  },
  applyText: { fontSize: 16, fontWeight: '600', color: colors.white },
})
