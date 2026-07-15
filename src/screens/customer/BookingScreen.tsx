import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { DropOffHourGrid } from '../../components/DropOffHourGrid'
import { ClothesListEditor } from '../../components/ClothesListEditor'
import { LoadListBreakdown } from '../../components/LoadListBreakdown'
import { LoadPhotoCapture } from '../../components/LoadPhotoCapture'
import { useApp } from '../../context/AppContext'
import { BackButton, ChoiceChip, OptionRow, PrimaryButton, Screen, StepIndicator } from '../../components/ui'
import { getHostPaymentMethods, PAYMENT_METHOD_LABELS } from '../../lib/hostSettingsStorage'
import {
  calculateBookingTotal,
  formatServicePrice,
  offersFoldingService,
  bookingTotalLabel,
} from '../../lib/hostPricing'
import { formatMoney } from '../../lib/bookingPayments'
import { sortDropOffHours, type DropOffHour } from '../../lib/dropOffAvailability'
import { colors, radius, spacing } from '../../theme'
import type { ClothesListItem, PaymentMethod, SheetsOption } from '../../types'

export function BookingScreen() {
  const { selectedHost, navigate, confirmBooking, getSettingsForHost } = useApp()
  const [dropOffTime, setDropOffTime] = useState<DropOffHour>(14)
  const [loads, setLoads] = useState(1)
  const [sheetsOption, setSheetsOption] = useState<SheetsOption>('own')
  const [foldingService, setFoldingService] = useState(false)
  const [notes, setNotes] = useState('')
  const [clothesList, setClothesList] = useState<ClothesListItem[]>([])
  const [loadPhotoUri, setLoadPhotoUri] = useState<string | null>(null)

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

  const availableTimes = useMemo(
    () => sortDropOffHours(hostSettings?.dropOffAvailability ?? []),
    [hostSettings?.dropOffAvailability],
  )

  useEffect(() => {
    if (availableTimes.length > 0 && !availableTimes.includes(dropOffTime)) {
      setDropOffTime(availableTimes[0])
    }
  }, [availableTimes, dropOffTime])

  if (!selectedHost) return null

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

  const canConfirm = paymentMethods.length > 0 && availableTimes.length > 0
  const validationHint = !availableTimes.length
    ? 'Host has no drop-off hours set'
    : !paymentMethods.length
      ? 'Host has no payment methods'
      : null

  const bookingStep =
    paymentMethod && loads >= 1
      ? loadPhotoUri || notes.trim() || clothesList.length > 0
        ? 4
        : 3
      : 2

  return (
    <View style={styles.wrapper}>
      <Screen>
        <BackButton onPress={() => navigate('customer-host-profile')} />
        <Text style={styles.eyebrow}>{selectedHost.location}</Text>
        <Text style={styles.title}>Book with {selectedHost.name}</Text>

        <StepIndicator
          steps={['Time', 'Loads', 'Pay', 'Clothes', 'Review']}
          current={Math.min(bookingStep, 4)}
        />

        <View style={styles.rateCard}>
          <Text style={styles.rateTitle}>Host rates (per load)</Text>
          <Text style={styles.rateLine}>Drying — {formatServicePrice(dryPrice)}</Text>
          {showFolding && (
            <Text style={styles.rateLine}>Folding — {formatServicePrice(foldingPrice)}</Text>
          )}
          <Text style={styles.rateLine}>Dryer sheets — {formatServicePrice(sheetsPrice)}</Text>
        </View>

        <Text style={styles.section}>Drop-off time</Text>
        <Text style={styles.sectionHint}>Pick an hour between 8am and 8pm</Text>
        {availableTimes.length === 0 ? (
          <Text style={styles.paymentNote}>This host has not set drop-off hours yet.</Text>
        ) : (
          <DropOffHourGrid
            mode="select"
            hours={availableTimes}
            value={dropOffTime}
            onChange={setDropOffTime}
          />
        )}

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
            {paymentMethod === 'bank_transfer' && (
              <Text style={styles.paymentNote}>
                After {selectedHost.name} accepts, you'll get bank details on My Load. Pay by transfer, then send your receipt screenshot on WhatsApp using the host's number.
              </Text>
            )}
            {paymentMethod === 'cash' && (
              <Text style={styles.paymentNote}>Bring cash to pay {selectedHost.name} at drop-off or pickup.</Text>
            )}
          </>
        )}

        <Text style={styles.section}>Dryer sheets</Text>
        {sheets.map((s) => (
          <OptionRow
            key={s.value}
            label={s.label}
            sub={s.sub}
            selected={sheetsOption === s.value}
            onPress={() => setSheetsOption(s.value)}
          />
        ))}

        {showFolding && (
          <>
            <Text style={styles.section}>Folding service</Text>
            <OptionRow
              label={`Add folding — ${formatServicePrice(foldingPrice)} per load`}
              sub="Host folds clothes after drying"
              selected={foldingService}
              onPress={() => setFoldingService(!foldingService)}
            />
          </>
        )}

        <Text style={styles.section}>What's in your load?</Text>
        <Text style={styles.sectionHint}>Optional — helps your host prepare</Text>
        <ClothesListEditor items={clothesList} onChange={setClothesList} />

        {clothesList.length > 0 && (
          <LoadListBreakdown items={clothesList} title="Your load list" />
        )}

        <Text style={styles.section}>Photo of your load</Text>
        <Text style={styles.sectionHint}>Show the host what you're dropping off</Text>
        <LoadPhotoCapture photoUri={loadPhotoUri} onPhotoChange={setLoadPhotoUri} />

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
        <View style={{ flex: 1 }}>
          <Text style={[styles.price, totalPrice <= 0 && styles.priceFree]}>
            {formatMoney(totalPrice)}
          </Text>
          <Text style={styles.priceSub}>{priceBreakdown}</Text>
          {validationHint && <Text style={styles.validationHint}>{validationHint}</Text>}
        </View>
        <PrimaryButton
          title="Confirm booking"
          disabled={!canConfirm}
          onPress={() =>
            confirmBooking({
              dropOffTime,
              loads,
              sheetsOption,
              notes,
              clothesList,
              paymentMethod,
              foldingService: showFolding && foldingService,
              loadPhotoUri: loadPhotoUri ?? undefined,
            })
          }
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.white },
  eyebrow: { fontSize: 13, color: colors.gray500, textTransform: 'capitalize', marginTop: spacing.sm, letterSpacing: 0.4 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: spacing.lg, lineHeight: 30 },
  rateCard: {
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
    marginBottom: spacing.sm,
  },
  rateTitle: { fontSize: 12, fontWeight: '700', color: colors.gray500, textTransform: 'capitalize', marginBottom: 4 },
  rateLine: { fontSize: 14, color: colors.gray600, fontWeight: '500' },
  section: { fontSize: 16, fontWeight: '600', marginTop: spacing.lg, marginBottom: spacing.md, textTransform: 'capitalize' },
  sectionHint: { fontSize: 13, color: colors.gray500, marginTop: -spacing.sm, marginBottom: spacing.md, textTransform: 'capitalize' },
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
  bankTitle: { fontSize: 12, fontWeight: '700', color: colors.gray500, textTransform: 'capitalize', marginBottom: 4 },
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
  validationHint: { fontSize: 12, color: colors.danger, marginTop: 4, fontWeight: '600' },
})
