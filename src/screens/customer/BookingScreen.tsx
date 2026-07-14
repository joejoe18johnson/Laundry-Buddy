import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useApp } from '../../context/AppContext'
import { BackButton, PrimaryButton, Screen } from '../../components/ui'
import { getHostPaymentMethods, PAYMENT_METHOD_LABELS } from '../../lib/hostSettingsStorage'
import {
  calculateBookingTotal,
  formatServicePrice,
  offersFoldingService,
  bookingTotalLabel,
} from '../../lib/hostPricing'
import { formatMoney } from '../../lib/bookingPayments'
import { colors, radius, spacing } from '../../theme'
import type { DropOffTime, PaymentMethod, SheetsOption } from '../../types'

export function BookingScreen() {
  const { selectedHost, navigate, confirmBooking, getSettingsForHost } = useApp()
  const [dropOffTime, setDropOffTime] = useState<DropOffTime>('2pm-4pm')
  const [loads, setLoads] = useState(1)
  const [sheetsOption, setSheetsOption] = useState<SheetsOption>('own')
  const [foldingService, setFoldingService] = useState(false)
  const [notes, setNotes] = useState('Please no high heat - gym clothes')

  const hostSettings = selectedHost ? getSettingsForHost(selectedHost.hostUserId) : null
  const paymentMethods = useMemo(
    () => (hostSettings ? getHostPaymentMethods(hostSettings) : []),
    [hostSettings],
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')

  useEffect(() => {
    if (paymentMethods.length > 0) {
      setPaymentMethod(paymentMethods[0])
    }
  }, [selectedHost?.id, paymentMethods.join(',')])

  if (!selectedHost) return null

  const times: { value: DropOffTime; label: string }[] = [
    { value: 'before-10', label: 'Before 10am' },
    { value: '2pm-4pm', label: '2pm – 4pm' },
    { value: 'after-4', label: 'After 4pm' },
  ]

  const dryPrice = selectedHost.price
  const foldingPrice = selectedHost.foldingPrice ?? 0
  const sheetsPrice = selectedHost.sheetsPrice ?? 1
  const showFolding = offersFoldingService({
    dryPrice,
    foldingPrice,
    sheetsPrice,
  })

  const sheets: { value: SheetsOption; label: string; sub?: string }[] = [
    { value: 'own', label: "I'll bring my own" },
    {
      value: 'buy',
      label: 'Buy from host',
      sub: `${formatServicePrice(sheetsPrice)} per load`,
    },
    { value: 'none', label: 'No sheets' },
  ]

  const totalPrice = calculateBookingTotal({
    loads,
    dryPrice,
    foldingPrice,
    sheetsPrice,
    sheetsOption,
    foldingService: showFolding && foldingService,
  })

  const priceBreakdown = bookingTotalLabel({
    loads,
    dryPrice,
    foldingPrice,
    sheetsPrice,
    sheetsOption,
    foldingService: showFolding && foldingService,
  })
  const bank = hostSettings?.bankDetails
  const showBankDetails =
    paymentMethod === 'bank_transfer' &&
    hostSettings?.acceptBankTransfer &&
    bank?.accountNumber.trim()

  return (
    <View style={styles.wrapper}>
      <Screen>
        <BackButton onPress={() => navigate('customer-host-profile')} />
        <Text style={styles.eyebrow}>{selectedHost.location}</Text>
        <Text style={styles.title}>Book with {selectedHost.name}</Text>

        <View style={styles.rateCard}>
          <Text style={styles.rateTitle}>Host rates (per load)</Text>
          <Text style={styles.rateLine}>Drying — {formatServicePrice(dryPrice)}</Text>
          {showFolding && (
            <Text style={styles.rateLine}>Folding — {formatServicePrice(foldingPrice)}</Text>
          )}
          <Text style={styles.rateLine}>Dryer sheets — {formatServicePrice(sheetsPrice)}</Text>
        </View>

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

        <Text style={styles.section}>Payment</Text>
        {paymentMethods.length === 0 ? (
          <Text style={styles.paymentNote}>This host has not set up payment options yet.</Text>
        ) : (
          <>
            <View style={styles.chips}>
              {paymentMethods.map((method) => (
                <Pressable
                  key={method}
                  onPress={() => setPaymentMethod(method)}
                  style={[styles.chip, paymentMethod === method && styles.chipSelected]}
                >
                  <Text
                    style={[styles.chipText, paymentMethod === method && styles.chipTextSelected]}
                  >
                    {PAYMENT_METHOD_LABELS[method]}
                  </Text>
                </Pressable>
              ))}
            </View>
            {showBankDetails && bank && (
              <View style={styles.bankCard}>
                <Text style={styles.bankTitle}>Transfer to this account</Text>
                <Text style={styles.bankLine}>{bank.bankName}</Text>
                <Text style={styles.bankLine}>{bank.accountName}</Text>
                <Text style={styles.bankAccount}>{bank.accountNumber}</Text>
                <Text style={styles.bankHint}>Pay before or at drop-off — host will confirm receipt.</Text>
              </View>
            )}
            {paymentMethod === 'cash' && (
              <Text style={styles.paymentNote}>Bring cash to pay {selectedHost.name} at drop-off or pickup.</Text>
            )}
          </>
        )}

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

        {showFolding && (
          <>
            <Text style={styles.section}>Folding service</Text>
            <Pressable
              onPress={() => setFoldingService(!foldingService)}
              style={styles.optionRow}
            >
              <View style={[styles.radio, foldingService && styles.radioSelected]} />
              <View>
                <Text style={styles.optionLabel}>
                  Add folding — {formatServicePrice(foldingPrice)} per load
                </Text>
                <Text style={styles.optionSub}>Host folds clothes after drying</Text>
              </View>
            </Pressable>
          </>
        )}

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
          <Text style={[styles.price, totalPrice <= 0 && styles.priceFree]}>
            {formatMoney(totalPrice)}
          </Text>
          <Text style={styles.priceSub}>{priceBreakdown}</Text>
        </View>
        <PrimaryButton
          title="Confirm booking"
          disabled={paymentMethods.length === 0}
          onPress={() =>
            confirmBooking({
              dropOffTime,
              loads,
              sheetsOption,
              notes,
              paymentMethod,
              foldingService: showFolding && foldingService,
            })
          }
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.white },
  eyebrow: { fontSize: 13, color: colors.gray500, textTransform: 'uppercase', marginTop: spacing.sm, letterSpacing: 0.4 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: spacing.lg, lineHeight: 30 },
  rateCard: {
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
    marginBottom: spacing.sm,
  },
  rateTitle: { fontSize: 12, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase', marginBottom: 4 },
  rateLine: { fontSize: 14, color: colors.gray600, fontWeight: '500' },
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
  paymentNote: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
  bankCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  bankTitle: { fontSize: 12, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase', marginBottom: 4 },
  bankLine: { fontSize: 15, fontWeight: '600' },
  bankAccount: { fontSize: 18, fontWeight: '700', letterSpacing: 0.5, marginVertical: 4 },
  bankHint: { fontSize: 12, color: colors.gray500, lineHeight: 17, marginTop: 4 },
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
  priceFree: { color: colors.green },
  priceSub: { fontSize: 12, color: colors.gray500, lineHeight: 18 },
})
