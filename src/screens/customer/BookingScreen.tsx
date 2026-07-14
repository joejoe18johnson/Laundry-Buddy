import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useApp } from '../../context/AppContext'
import { BackButton, PrimaryButton, Screen } from '../../components/ui'
import { colors, radius, spacing } from '../../theme'
import type { DropOffTime, SheetsOption } from '../../types'

export function BookingScreen() {
  const { selectedHost, navigate, confirmBooking } = useApp()
  const [dropOffTime, setDropOffTime] = useState<DropOffTime>('2pm-4pm')
  const [loads, setLoads] = useState(1)
  const [sheetsOption, setSheetsOption] = useState<SheetsOption>('own')
  const [notes, setNotes] = useState('Please no high heat - gym clothes')

  if (!selectedHost) return null

  const times: { value: DropOffTime; label: string }[] = [
    { value: 'before-10', label: 'Before 10am' },
    { value: '2pm-4pm', label: '2pm – 4pm' },
    { value: 'after-4', label: 'After 4pm' },
  ]

  const sheets: { value: SheetsOption; label: string; sub?: string }[] = [
    { value: 'own', label: "I'll bring my own" },
    { value: 'buy', label: 'Buy from host', sub: '$1' },
    { value: 'none', label: 'No sheets' },
  ]

  return (
    <View style={styles.wrapper}>
      <Screen>
        <BackButton onPress={() => navigate('customer-host-profile')} />
        <Text style={styles.eyebrow}>{selectedHost.location}</Text>
        <Text style={styles.title}>Book with {selectedHost.name}</Text>

        <Text style={styles.section}>Drop-off time</Text>
        <View style={styles.chips}>
          {times.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => setDropOffTime(t.value)}
              style={[styles.chip, dropOffTime === t.value && styles.chipSelected]}
            >
              <Text style={[styles.chipText, dropOffTime === t.value && styles.chipTextSelected]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Loads</Text>
        <View style={styles.stepper}>
          <Pressable onPress={() => setLoads(Math.max(1, loads - 1))} style={styles.stepBtn}>
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <View style={styles.stepValue}>
            <Text style={styles.stepCount}>{loads}</Text>
            <Text style={styles.stepLabel}>standard basket{loads > 1 ? 's' : ''}</Text>
          </View>
          <Pressable onPress={() => setLoads(loads + 1)} style={styles.stepBtn}>
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Dryer sheets</Text>
        {sheets.map((s) => (
          <Pressable
            key={s.value}
            onPress={() => setSheetsOption(s.value)}
            style={styles.optionRow}
          >
            <View style={[styles.radio, sheetsOption === s.value && styles.radioSelected]} />
            <View>
              <Text style={styles.optionLabel}>{s.label}</Text>
              {s.sub && <Text style={styles.optionSub}>{s.sub}</Text>}
            </View>
          </Pressable>
        ))}

        <Text style={styles.section}>Special notes</Text>
        <TextInput
          style={styles.notes}
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any special instructions..."
        />
        <View style={{ height: 120 }} />
      </Screen>

      <View style={styles.footer}>
        <View>
          <Text style={styles.price}>Free</Text>
          <Text style={styles.priceSub}>No payment required</Text>
        </View>
        <PrimaryButton
          title="Confirm booking"
          onPress={() => confirmBooking({ dropOffTime, loads, sheetsOption, notes })}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.white },
  eyebrow: { fontSize: 13, color: colors.gray500, textTransform: 'uppercase', marginTop: spacing.sm, letterSpacing: 0.4 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: spacing.lg, lineHeight: 30 },
  section: { fontSize: 16, fontWeight: '600', marginTop: spacing.lg, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  chipSelected: { backgroundColor: colors.black, borderColor: colors.black },
  chipText: { fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: colors.white },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 280, marginVertical: spacing.sm },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 22, color: colors.black },
  stepValue: { alignItems: 'center' },
  stepCount: { fontSize: 24, fontWeight: '700' },
  stepLabel: { fontSize: 13, color: colors.gray500 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  radioSelected: { borderColor: colors.black, backgroundColor: colors.black },
  optionLabel: { fontSize: 16, fontWeight: '500' },
  optionSub: { fontSize: 13, color: colors.gray500 },
  notes: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.screen,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  price: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  priceSub: { fontSize: 12, color: colors.gray500, lineHeight: 18 },
})
