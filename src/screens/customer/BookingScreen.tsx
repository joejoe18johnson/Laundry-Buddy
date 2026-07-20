import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DropOffHourGrid } from '../../components/DropOffHourGrid'
import { ClothesListEditor } from '../../components/ClothesListEditor'
import { LoadListBreakdown } from '../../components/LoadListBreakdown'
import { LoadPhotoCapture } from '../../components/LoadPhotoCapture'
import { NotificationBellReminder } from '../../components/NotificationBellReminder'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { canBookOrHost } from '../../lib/identityVerification'
import { BackButton, AppTextInput, GhostButton, OptionRow, PrimaryButton, Screen, StepIndicator } from '../../components/ui'
import { getHostPaymentMethods, PAYMENT_METHOD_LABELS } from '../../lib/hostSettingsStorage'
import {
  calculateBookingTotal,
  DRYER_SHEETS_PRICE,
  formatDryerSheetsPerLoadCharge,
  formatDryerSheetsRate,
  formatServicePrice,
  offersFoldingService,
  bookingTotalLabel,
} from '../../lib/hostPricing'
import { formatMoney, cashPaymentGuestHint } from '../../lib/bookingPayments'
import { formatHostDisplayName } from '../../lib/displayName'
import { formatDropOffHour, formatDropOffHoursWindow, sortDropOffHours, type DropOffHour } from '../../lib/dropOffAvailability'
import { bottomSafePadding } from '../../lib/safeAreaInsets'
import { titleCaseWithName, toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'
import type { ClothesListItem, PaymentMethod, SheetsOption } from '../../types'

export function BookingScreen() {
  const { selectedHost, navigate, confirmBooking, getSettingsForHost } = useApp()
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createBookingStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const footerBottomPad = bottomSafePadding(insets.bottom)
  const [dropOffTime, setDropOffTime] = useState<DropOffHour>(14)
  const [loads, setLoads] = useState(1)
  const [sheetsOption, setSheetsOption] = useState<SheetsOption>('own')
  const [foldingService, setFoldingService] = useState(false)
  const [notes, setNotes] = useState('')
  const [clothesList, setClothesList] = useState<ClothesListItem[]>([])
  const [loadPhotoUri, setLoadPhotoUri] = useState<string | null>(null)
  const [wizardStep, setWizardStep] = useState(0)

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

  useEffect(() => {
    if (!user || canBookOrHost(user)) return
    navigate('identity-verification')
  }, [navigate, user])

  if (!selectedHost) return null

  const displayName = formatHostDisplayName(selectedHost.name)
  const dryPrice = selectedHost.price
  const foldingPrice = selectedHost.foldingPrice ?? 0
  const sheetsPrice = DRYER_SHEETS_PRICE
  const showFolding = offersFoldingService({
    dryPrice,
    foldingPrice,
    sheetsPrice,
  })

  const sheets: { value: SheetsOption; label: string; sub?: string }[] = [
    { value: 'own', label: "I'll Bring My Own" },
    {
      value: 'buy',
      label: 'Buy From Host',
      sub: `${formatDryerSheetsRate()} (${formatDryerSheetsPerLoadCharge()})`,
    },
    { value: 'none', label: 'No Sheets' },
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
  const essentialsReady = canConfirm && loads >= 1
  const validationHint = !availableTimes.length
    ? 'Host Has No Drop Off Hours Set'
    : !paymentMethods.length
      ? 'Host Has No Payment Methods'
      : null

  const submitBooking = () =>
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

  return (
    <View style={styles.wrapper}>
      <Screen>
        <BackButton onPress={() => (wizardStep > 0 ? setWizardStep(wizardStep - 1) : navigate('customer-host-profile'))} />
        <NotificationBellReminder compact onPressBell={() => navigate('notifications')} />
        <Text style={styles.eyebrow}>{selectedHost.location}</Text>
        <Text style={styles.title}>
          {titleCaseWithName(`Book with ${displayName}`, displayName)}
        </Text>

        <StepIndicator steps={['Essentials', 'Details', 'Send']} current={wizardStep} />

        {wizardStep === 0 ? (
          <>
            <View style={styles.rateCard}>
              <Text style={styles.rateTitle}>{toTitleCase('Host Rates (Per Load)')}</Text>
              <Text style={styles.rateLine}>{toTitleCase('Drying')} — {formatServicePrice(dryPrice)}</Text>
              {showFolding && (
                <Text style={styles.rateLine}>{toTitleCase('Folding')} — {formatServicePrice(foldingPrice)}</Text>
              )}
            </View>

            <Text style={styles.section}>{toTitleCase('Drop Off Time')}</Text>
            <Text style={styles.sectionHint}>{toTitleCase('Pick an hour between')} {formatDropOffHoursWindow()}</Text>
            {availableTimes.length === 0 ? (
              <Text style={styles.paymentNote}>{toTitleCase('This Host Has Not Set Drop Off Hours Yet.')}</Text>
            ) : (
              <DropOffHourGrid
                mode="select"
                hours={availableTimes}
                value={dropOffTime}
                onChange={setDropOffTime}
              />
            )}

            <Text style={styles.section}>{toTitleCase('Loads')}</Text>
            <View style={styles.stepper}>
              <Pressable onPress={() => setLoads(Math.max(1, loads - 1))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <View style={styles.stepValue}>
                <Text style={styles.stepCount}>{loads}</Text>
                <Text style={styles.stepLabel}>{toTitleCase(`standard basket${loads > 1 ? 's' : ''}`)}</Text>
              </View>
              <Pressable onPress={() => setLoads(loads + 1)} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.section}>{toTitleCase('Payment')}</Text>
            {paymentMethods.length === 0 ? (
              <Text style={styles.paymentNote}>{toTitleCase('This Host Has Not Set Up Payment Options Yet.')}</Text>
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
                    {titleCaseWithName(
                      `After ${displayName} accepts, open My loads for bank details. Transfer in the app and submit your receipt screenshot — no WhatsApp needed.`,
                      displayName,
                    )}
                  </Text>
                )}
                {paymentMethod === 'cash' && (
                  <Text style={styles.paymentNote}>
                    {titleCaseWithName(cashPaymentGuestHint(displayName), displayName)}
                  </Text>
                )}
              </>
            )}
          </>
        ) : null}

        {wizardStep === 1 ? (
          <>
            <Text style={styles.sectionHint}>
              {toTitleCase('Optional — skip if you are in a hurry. You can add details later in chat.')}
            </Text>

            <Text style={styles.section}>{toTitleCase('Dryer Sheets')}</Text>
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
                <Text style={styles.section}>{toTitleCase('Folding Service')}</Text>
                <OptionRow
                  label={`Add Folding — ${formatServicePrice(foldingPrice)} Per Load`}
                  sub="Host Folds Clothes After Drying"
                  selected={foldingService}
                  onPress={() => setFoldingService(!foldingService)}
                />
              </>
            )}

            <Text style={styles.section}>{toTitleCase("What's In Your Load?")}</Text>
            <ClothesListEditor items={clothesList} onChange={setClothesList} />
            {clothesList.length > 0 && <LoadListBreakdown items={clothesList} title="Your Load List" />}

            <Text style={styles.section}>{toTitleCase('Photo Of Your Load')}</Text>
            <LoadPhotoCapture photoUri={loadPhotoUri} onPhotoChange={setLoadPhotoUri} />

            <Text style={styles.section}>{toTitleCase('Special Notes')}</Text>
            <AppTextInput
              style={styles.notes}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any special instructions..."
            />
          </>
        ) : null}

        {wizardStep === 2 ? (
          <>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>{toTitleCase('Review your request')}</Text>
              <Text style={styles.reviewLine}>{toTitleCase('Drop off')} — {formatDropOffHour(dropOffTime)}</Text>
              <Text style={styles.reviewLine}>
                {loads} load{loads === 1 ? '' : 's'} · {PAYMENT_METHOD_LABELS[paymentMethod]}
              </Text>
              {priceBreakdown ? <Text style={styles.reviewLine}>{priceBreakdown}</Text> : null}
              {notes.trim() ? <Text style={styles.reviewLine}>Notes — {notes.trim()}</Text> : null}
            </View>
            <NotificationBellReminder onPressBell={() => navigate('notifications')} />
            <Text style={styles.paymentNote}>
              {toTitleCase(
                'Turn on bell notifications before sending — you will get an alert as soon as the host accepts or declines.',
              )}
            </Text>
          </>
        ) : null}

        <View style={{ height: 148 }} />
      </Screen>

      <View style={[styles.footerShell, { paddingBottom: footerBottomPad }]}>
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerSummary} numberOfLines={2}>
              <Text style={[styles.footerPrice, totalPrice <= 0 && styles.footerPriceFree]}>
                {formatMoney(totalPrice)}
              </Text>
              {priceBreakdown ? (
                <Text style={styles.footerMetaInline}> · {priceBreakdown}</Text>
              ) : null}
            </Text>
            {validationHint ? <Text style={styles.validationHint}>{toTitleCase(validationHint)}</Text> : null}
          </View>
          <View style={styles.footerAction}>
            {wizardStep === 0 ? (
              <PrimaryButton
                title="Continue"
                icon="chevron-right"
                disabled={!essentialsReady}
                onPress={() => setWizardStep(1)}
              />
            ) : wizardStep === 1 ? (
              <View style={styles.footerButtons}>
                <GhostButton title="Skip" onPress={() => setWizardStep(2)} />
                <PrimaryButton title="Review" icon="eye" onPress={() => setWizardStep(2)} />
              </View>
            ) : (
              <PrimaryButton title="Send request" icon="send" disabled={!canConfirm} onPress={submitBooking} />
            )}
          </View>
        </View>
      </View>
    </View>
  )
}

function createBookingStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.white },
  eyebrow: { fontSize: 13, color: colors.gray500, marginTop: spacing.sm, letterSpacing: 0.4 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: spacing.lg, lineHeight: 30, color: colors.black },
  rateCard: {
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
    marginBottom: spacing.sm,
  },
  rateTitle: { fontSize: 12, fontWeight: '700', color: colors.gray500, marginBottom: 4 },
  rateLine: { fontSize: 14, color: colors.gray600, fontWeight: '500' },
  reviewCard: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.gray50,
  },
  reviewTitle: { fontSize: 16, fontWeight: '700', color: colors.black, marginBottom: spacing.sm },
  reviewLine: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  section: { fontSize: 16, fontWeight: '600', marginTop: spacing.lg, marginBottom: spacing.md, color: colors.black },
  sectionHint: { fontSize: 13, color: colors.gray500, marginTop: -spacing.sm, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  chipSelected: { backgroundColor: colors.black, borderColor: colors.black },
  chipText: { fontSize: 14, fontWeight: '500', color: colors.black },
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
  bankTitle: { fontSize: 12, fontWeight: '700', color: colors.gray500, marginBottom: 4 },
  bankLine: { fontSize: 15, fontWeight: '600', color: colors.black },
  bankAccount: { fontSize: 18, fontWeight: '700', letterSpacing: 0.5, marginVertical: 4, color: colors.black },
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
  stepCount: { fontSize: 24, fontWeight: '700', color: colors.black },
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
  optionLabel: { fontSize: 16, fontWeight: '500', color: colors.black },
  optionSub: { fontSize: 13, color: colors.gray500 },
  notes: {
    borderRadius: radius.md,
    minHeight: 100,
  },
  footerShell: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  footerInfo: { flex: 1, minWidth: 0, gap: 4, justifyContent: 'center' },
  footerSummary: { lineHeight: 22 },
  footerPrice: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, color: colors.black },
  footerPriceFree: { color: colors.green },
  footerMetaInline: { fontSize: 13, fontWeight: '500', color: colors.gray500 },
  footerAction: { flexShrink: 0, alignSelf: 'center' },
  footerButtons: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  validationHint: { fontSize: 12, color: colors.danger, fontWeight: '600', lineHeight: 16 },
  })
}
