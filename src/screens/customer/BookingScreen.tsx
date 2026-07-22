import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon } from '../../components/AppIcon'
import type { IconName } from '../../components/AppIcon'
import { DropOffHourGrid } from '../../components/DropOffHourGrid'
import { ClothesListEditor } from '../../components/ClothesListEditor'
import { LoadListBreakdown } from '../../components/LoadListBreakdown'
import { LoadPhotoCapture } from '../../components/LoadPhotoCapture'
import { NotificationBellReminder } from '../../components/NotificationBellReminder'
import { PriceFooterBar, priceFooterShellStyle } from '../../components/PriceFooterBar'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { canBookOrHost } from '../../lib/identityVerification'
import { BackButton, AppTextInput, OptionRow, PrimaryButton, Screen, StepIndicator } from '../../components/ui'
import { getHostPaymentMethods, PAYMENT_METHOD_LABELS } from '../../lib/hostSettingsStorage'
import {
  calculateBookingTotal,
  formatDryerSheetsPerLoadCharge,
  formatDryerSheetsRate,
  formatFooterAddonAmount,
  formatServicePrice,
  getHostPricing,
  offersFoldingService,
  bookingFooterAddonLines,
  bookingReceiptLines,
  formatReceiptAmount,
} from '../../lib/hostPricing'
import { formatMoney, cashPaymentGuestHint } from '../../lib/bookingPayments'
import { formatHostDisplayName } from '../../lib/displayName'
import { formatDropOffHour, formatDropOffHoursWindow, sortDropOffHours, type DropOffHour } from '../../lib/dropOffAvailability'
import { getPushPermissionStatus } from '../../lib/pushNotifications'
import { bottomSafePadding } from '../../lib/safeAreaInsets'
import { titleCaseWithName, toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'
import type { ClothesListItem, PaymentMethod, SheetsOption } from '../../types'

export function BookingScreen() {
  const {
    selectedHost,
    navigate,
    confirmBooking,
    getSettingsForHost,
    bookingDraft,
    patchBookingDraft,
  } = useApp()
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createBookingStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const footerBottomPad = bottomSafePadding(insets.bottom)

  const hostSettings = selectedHost ? getSettingsForHost(selectedHost.hostUserId) : null
  const paymentMethods = useMemo(
    () => (hostSettings ? getHostPaymentMethods(hostSettings) : []),
    [hostSettings],
  )
  const availableTimes = useMemo(
    () => sortDropOffHours(hostSettings?.dropOffAvailability ?? []),
    [hostSettings?.dropOffAvailability],
  )

  useEffect(() => {
    if (!user || canBookOrHost(user)) return
    navigate('identity-verification')
  }, [navigate, user])

  useEffect(() => {
    if (!selectedHost || !bookingDraft || bookingDraft.hostId !== selectedHost.id) return
    if (availableTimes.length > 0 && !availableTimes.includes(bookingDraft.dropOffTime)) {
      patchBookingDraft({ dropOffTime: availableTimes[0] })
    }
  }, [availableTimes, bookingDraft, patchBookingDraft, selectedHost])

  useEffect(() => {
    if (!bookingDraft || paymentMethods.length === 0) return
    if (!paymentMethods.includes(bookingDraft.paymentMethod)) {
      patchBookingDraft({ paymentMethod: paymentMethods[0] })
    }
  }, [bookingDraft, patchBookingDraft, paymentMethods])

  if (!selectedHost || !hostSettings || !bookingDraft || bookingDraft.hostId !== selectedHost.id) {
    return null
  }

  const {
    wizardStep,
    dropOffTime,
    loads,
    sheetsOption,
    foldingService,
    notes,
    clothesList,
    loadPhotoUri,
    paymentMethod,
  } = bookingDraft

  const displayName = formatHostDisplayName(selectedHost.name)
  const pricing = getHostPricing(selectedHost, hostSettings)
  const dryPrice = pricing.dryPrice
  const foldingPrice = pricing.foldingPrice
  const sheetsPrice = pricing.sheetsPrice
  const showFolding = offersFoldingService(pricing)

  const sheets: { value: SheetsOption; label: string; sub?: string }[] = [
    { value: 'own', label: "I'll Bring My Own" },
    {
      value: 'buy',
      label: 'Buy From Host',
      sub: `${formatDryerSheetsRate(sheetsPrice)} (${formatDryerSheetsPerLoadCharge(sheetsPrice)})`,
    },
    { value: 'none', label: 'No Sheets' },
  ]

  const priceInput = {
    loads,
    dryPrice,
    foldingPrice,
    sheetsPrice,
    sheetsOption,
    foldingService: showFolding && foldingService,
  }

  const totalPrice = calculateBookingTotal(priceInput)

  const receiptLines = bookingReceiptLines(priceInput)
  const footerAddonLines = bookingFooterAddonLines(priceInput)
  const drySubtotal = dryPrice * loads

  const sheetsReviewLabel =
    sheetsOption === 'buy'
      ? toTitleCase('Buy from host')
      : sheetsOption === 'none'
        ? toTitleCase('No sheets')
        : toTitleCase('Bring my own')

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
        <BackButton
          onPress={() =>
            wizardStep > 0
              ? patchBookingDraft({ wizardStep: wizardStep - 1 })
              : navigate('customer-host-profile')
          }
        />
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
                onChange={(hour) => patchBookingDraft({ dropOffTime: hour })}
              />
            )}

            <Text style={styles.section}>{toTitleCase('Loads')}</Text>
            <View style={styles.stepper}>
              <Pressable onPress={() => patchBookingDraft({ loads: Math.max(1, loads - 1) })} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <View style={styles.stepValue}>
                <Text style={styles.stepCount}>{loads}</Text>
                <Text style={styles.stepLabel}>{toTitleCase(`standard basket${loads > 1 ? 's' : ''}`)}</Text>
              </View>
              <Pressable onPress={() => patchBookingDraft({ loads: loads + 1 })} style={styles.stepBtn}>
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
                      onPress={() => patchBookingDraft({ paymentMethod: method })}
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
                  <View style={styles.paymentCallout}>
                    <Text style={styles.paymentCalloutText}>
                      {titleCaseWithName(
                        `After ${displayName} accepts, open My loads for bank details. Transfer in the app and submit your receipt screenshot — no WhatsApp needed.`,
                        displayName,
                      )}
                    </Text>
                  </View>
                )}
                {paymentMethod === 'cash' && (
                  <View style={styles.paymentCallout}>
                    <Text style={styles.paymentCalloutText}>
                      {titleCaseWithName(cashPaymentGuestHint(displayName), displayName)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        ) : null}

        {wizardStep === 1 ? (
          <>
            <Text style={styles.sectionHint}>
              {toTitleCase('Optional — you can add more details later in chat.')}
            </Text>

            <Text style={styles.section}>{toTitleCase('Dryer Sheets')}</Text>
            {sheets.map((s) => (
              <OptionRow
                key={s.value}
                label={s.label}
                sub={s.sub}
                selected={sheetsOption === s.value}
                onPress={() => patchBookingDraft({ sheetsOption: s.value })}
              />
            ))}

            {showFolding && (
              <>
                <Text style={styles.section}>{toTitleCase('Folding Service')}</Text>
                <OptionRow
                  label={`Add Folding — ${formatServicePrice(foldingPrice)} Per Load`}
                  sub="Host Folds Clothes After Drying"
                  selected={foldingService}
                  onPress={() => patchBookingDraft({ foldingService: !foldingService })}
                />
              </>
            )}

            <Text style={styles.section}>{toTitleCase("What's In Your Load?")}</Text>
            <ClothesListEditor items={clothesList} onChange={(items) => patchBookingDraft({ clothesList: items })} />
            {clothesList.length > 0 && <LoadListBreakdown items={clothesList} title="Your Load List" />}

            <Text style={styles.section}>{toTitleCase('Photo Of Your Load')}</Text>
            <LoadPhotoCapture
              photoUri={loadPhotoUri}
              onPhotoChange={(uri) => patchBookingDraft({ loadPhotoUri: uri })}
            />

            <Text style={styles.section}>{toTitleCase('Special Notes')}</Text>
            <AppTextInput
              style={styles.notes}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={(text) => patchBookingDraft({ notes: text })}
              placeholder="Any special instructions..."
            />
          </>
        ) : null}

        {wizardStep === 2 ? (
          <>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>{toTitleCase('Review your request')}</Text>

              <View style={styles.reviewMetaList}>
                <ReviewMetaRow icon="clock" label={toTitleCase('Drop off')} value={formatDropOffHour(dropOffTime)} />
                <ReviewMetaRow
                  icon="package"
                  label={toTitleCase('Loads')}
                  value={`${loads} · ${PAYMENT_METHOD_LABELS[paymentMethod]}`}
                />
                <ReviewMetaRow icon="layers" label={toTitleCase('Sheets')} value={sheetsReviewLabel} />
                {showFolding ? (
                  <ReviewMetaRow
                    icon="wind"
                    label={toTitleCase('Folding')}
                    value={foldingService ? toTitleCase('Added') : toTitleCase('Not added')}
                  />
                ) : null}
                {notes.trim() ? (
                  <ReviewMetaRow icon="file-text" label={toTitleCase('Notes')} value={notes.trim()} />
                ) : null}
              </View>

              <View style={styles.receiptBlock}>
                <Text style={styles.receiptHeading}>{toTitleCase('Price breakdown')}</Text>
                {receiptLines.map((line) => (
                  <View key={line.label} style={styles.receiptRow}>
                    <View style={styles.receiptRowCopy}>
                      <Text style={styles.receiptLabel}>{line.label}</Text>
                      <Text style={styles.receiptDetail}>{line.detail}</Text>
                    </View>
                    <Text style={styles.receiptAmount}>{formatReceiptAmount(line.amount)}</Text>
                  </View>
                ))}
                <View style={styles.receiptDivider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptTotalLabel}>{toTitleCase('Total')}</Text>
                  <Text style={styles.receiptTotalAmount}>{formatMoney(totalPrice)}</Text>
                </View>
              </View>
            </View>

            <SendStepNotificationHint onPressBell={() => navigate('notifications')} />
          </>
        ) : null}

        <View style={{ height: 148 }} />
      </Screen>

      <View style={[styles.footerShell, { paddingBottom: footerBottomPad }]}>
        <PriceFooterBar
          price={formatMoney(totalPrice)}
          isFree={totalPrice <= 0}
          baseLine={
            wizardStep === 2
              ? toTitleCase('Ready to send')
              : `${loads} load${loads === 1 ? '' : 's'} · ${formatServicePrice(dryPrice)} dry${
                  loads > 1 ? ` (${formatMoney(drySubtotal)})` : ''
                }`
          }
          addonLines={
            wizardStep === 2
              ? []
              : footerAddonLines.map((line) => ({
                  label: line.label,
                  amount: formatFooterAddonAmount(line.amount),
                }))
          }
          hint={validationHint ? toTitleCase(validationHint) : undefined}
          action={
            wizardStep === 0 ? (
              <PrimaryButton
                title="Continue"
                icon="chevron-right"
                disabled={!essentialsReady}
                onPress={() => patchBookingDraft({ wizardStep: 1 })}
              />
            ) : wizardStep === 1 ? (
              <PrimaryButton title="Review" icon="eye" onPress={() => patchBookingDraft({ wizardStep: 2 })} />
            ) : (
              <PrimaryButton title="Send request" icon="send" disabled={!canConfirm} onPress={submitBooking} />
            )
          }
        />
        {wizardStep === 2 ? (
          <Text style={styles.footerSendMeta}>
            {formatDropOffHour(dropOffTime)} · {PAYMENT_METHOD_LABELS[paymentMethod]}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

function ReviewMetaRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const { colors } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
          paddingVertical: spacing.sm,
        },
        iconWrap: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.gray200,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        },
        copy: { flex: 1, gap: 2 },
        label: { fontSize: 12, fontWeight: '600', color: colors.gray500, letterSpacing: 0.2 },
        value: { fontSize: 15, fontWeight: '600', color: colors.black, lineHeight: 20 },
      }),
    [colors],
  )

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <AppIcon name={icon} size={15} color={colors.black} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  )
}

function SendStepNotificationHint({ onPressBell }: { onPressBell?: () => void }) {
  const { colors } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          borderWidth: 1,
          borderColor: colors.black,
          borderRadius: radius.lg,
          backgroundColor: colors.gray50,
          padding: spacing.md,
          marginTop: spacing.md,
        },
        iconWrap: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.gray200,
        },
        body: { flex: 1, gap: 4 },
        title: { fontSize: 15, fontWeight: '700', color: colors.black },
        sub: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
        action: { fontSize: 13, fontWeight: '700', color: colors.black },
      }),
    [colors],
  )
  const [notificationsOn, setNotificationsOn] = useState<boolean | null>(null)

  useEffect(() => {
    void getPushPermissionStatus().then((status) => {
      setNotificationsOn(status === 'granted' || status === 'unsupported')
    })
  }, [])

  if (notificationsOn === null) return null

  if (!notificationsOn) {
    return <NotificationBellReminder compact onPressBell={onPressBell} />
  }

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <AppIcon name="check-circle" size={18} color={colors.black} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{toTitleCase('Notifications on')}</Text>
        <Text style={styles.sub}>
          {toTitleCase("We'll alert you as soon as the host accepts, declines, or updates your load.")}
        </Text>
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
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.white,
  },
  reviewTitle: { fontSize: 18, fontWeight: '700', color: colors.black },
  reviewMetaList: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.sm,
    gap: 2,
  },
  receiptBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  receiptHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray500,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  receiptRowCopy: { flex: 1, gap: 2 },
  receiptLabel: { fontSize: 15, fontWeight: '600', color: colors.black },
  receiptDetail: { fontSize: 13, color: colors.gray500 },
  receiptAmount: { fontSize: 15, fontWeight: '700', color: colors.black },
  receiptDivider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 4,
  },
  receiptTotalLabel: { fontSize: 16, fontWeight: '700', color: colors.black },
  receiptTotalAmount: { fontSize: 18, fontWeight: '800', color: colors.black, letterSpacing: -0.3 },
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
  paymentCallout: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray50,
  },
  paymentCalloutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    lineHeight: 24,
  },
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
  footerShell: priceFooterShellStyle(colors),
  footerSendMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray500,
    textAlign: 'center',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
  },
  })
}
