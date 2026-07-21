import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { TransferProofCapture } from '../../components/TransferProofCapture'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useMessages } from '../../context/MessageContext'
import { getHostById } from '../../data/mockData'
import { formatHostDisplayName } from '../../lib/displayName'
import { getBookingAmount, formatMoney, cashPaymentGuestHint } from '../../lib/bookingPayments'
import { buildPaymentProofChatNotice } from '../../lib/chatThreads'
import { openDirections, openHostDirections } from '../../lib/openDirections'
import { LoadProgressTracker } from '../../components/LoadProgressTracker'
import { NotificationBellReminder } from '../../components/NotificationBellReminder'
import { BackButton, OutlineButton, PrimaryButton, Screen, StatusBadge } from '../../components/ui'
import { getGuestProgressStep, getGuestStepDescription } from '../../lib/loadProgress'
import {
  canGuestCancelPendingRequest,
  formatCancelCountdown,
  getMsUntilGuestCanCancel,
} from '../../lib/pendingRequestCancel'
import { titleCaseWithName, toTitleCase } from '../../lib/titleCase'
import { LoadListBreakdown } from '../../components/LoadListBreakdown'
import { useTheme } from '../../context/ThemeContext'
import { radius, spacing } from '../../theme'
import type { Booking } from '../../types'

function getLoadStatusLabel(load: Booking): string {
  if (load.requestStatus === 'pending') return 'Awaiting'
  if (load.requestStatus === 'declined') return 'Declined'
  if (load.stage === 'ready') return 'Ready'
  if (load.stage === 'drying') return 'Drying'
  if (
    load.paymentMethod === 'bank_transfer' &&
    load.paymentStatus === 'pending' &&
    (load.totalAmount ?? 0) > 0
  ) {
    if (!load.paymentRequestedAt) return 'Awaiting payment'
    if (!load.paymentProofSentAt) return 'Pay now'
    return 'Proof sent'
  }
  if (
    load.paymentMethod === 'cash' &&
    load.paymentStatus === 'pending' &&
    (load.totalAmount ?? 0) > 0
  ) {
    return 'Pay at drop-off'
  }
  return 'In progress'
}

export function TrackingScreen() {
  const { user } = useAuth()
  const { booking, activeGuestBookings, selectGuestBooking, navigate, getSettingsForHost, confirmPickup, openLeaveReview, clearBooking, cancelPendingRequest, openChat, markPaymentProofSent, refreshGuestBookings } = useApp()
  const { sendMessage } = useMessages()
  const [bannerVisible, setBannerVisible] = useState(true)
  const [transferProofUri, setTransferProofUri] = useState<string | null>(null)
  const [cancelTick, setCancelTick] = useState(0)
  const pulse = useRef(new Animated.Value(1)).current
  const { colors } = useTheme()
  const styles = useMemo(() => createTrackingStyles(colors), [colors])

  useEffect(() => {
    void refreshGuestBookings()
  }, [refreshGuestBookings])

  useEffect(() => {
    setBannerVisible(true)
    setTransferProofUri(null)
  }, [booking?.id])

  useEffect(() => {
    if (!booking?.isNew || booking.requestStatus === 'declined') return
    const timer = setTimeout(() => setBannerVisible(false), 6000)
    return () => clearTimeout(timer)
  }, [booking?.id, booking?.isNew, booking?.requestStatus])

  useEffect(() => {
    if (!booking || booking.requestStatus !== 'pending') return
    const id = setInterval(() => setCancelTick((value) => value + 1), 30_000)
    return () => clearInterval(id)
  }, [booking?.id, booking?.requestStatus])

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse, booking?.stage])

  if (!booking) {
    return (
      <Screen style={styles.empty}>
        <Text style={styles.emptyTitle}>{toTitleCase('No active loads')}</Text>
        <Text style={styles.emptySub}>{toTitleCase('Find a host to book your first load, or book another anytime')}</Text>
        <PrimaryButton title="Explore dryers" icon="search" onPress={() => navigate('customer-home')} full />
      </Screen>
    )
  }

  const progressStep = getGuestProgressStep(booking)
  const host = getHostById(booking.hostId)
  const hostSettings = getSettingsForHost(host?.hostUserId)
  const amount = getBookingAmount(booking)
  const isBankTransfer = booking.paymentMethod === 'bank_transfer'
  const isCash = booking.paymentMethod === 'cash'
  const isAccepted = booking.requestStatus !== 'pending' && booking.requestStatus !== 'declined'
  const isPending = booking.requestStatus === 'pending'
  const isDeclined = booking.requestStatus === 'declined'
  const transferPending =
    isAccepted && isBankTransfer && booking.paymentStatus === 'pending' && amount > 0 && !!booking.paymentRequestedAt
  const needsPayNow = transferPending && !booking.paymentProofSentAt
  const proofWaitingConfirm =
    isAccepted &&
    isBankTransfer &&
    booking.paymentStatus === 'pending' &&
    !!booking.paymentProofSentAt &&
    amount > 0
  const cashPayAtDropOff =
    isAccepted && isCash && booking.paymentStatus === 'pending' && amount > 0
  const bank = hostSettings.bankDetails

  const isReadyForPickup = isAccepted && booking.stage === 'ready'
  const isDropOffPhase = isAccepted && !isReadyForPickup
  const canCancelPending = isPending && canGuestCancelPendingRequest(booking)
  const msUntilCancel = isPending ? getMsUntilGuestCanCancel(booking) : 0
  void cancelTick

  const handleConfirmPickup = () => {
    if (!booking) return
    const bookingId = booking.id
    const hostId = booking.hostId
    confirmPickup(bookingId)
    openLeaveReview(hostId, bookingId)
  }

  const statusBadge = isDeclined
    ? { label: 'Declined', variant: 'declined' as const }
    : isPending
      ? { label: 'Awaiting host', variant: 'awaiting' as const }
      : booking.stage === 'ready'
        ? { label: 'Ready', variant: 'ready' as const }
        : booking.stage === 'drying'
          ? { label: 'Drying', variant: 'drying' as const }
          : proofWaitingConfirm
            ? { label: 'Awaiting confirm', variant: 'awaiting' as const }
            : needsPayNow
              ? { label: 'Pay now', variant: 'pending' as const }
              : cashPayAtDropOff
                ? { label: 'Pay at drop-off', variant: 'pending' as const }
                : { label: 'Accepted', variant: 'accepted' as const }

  const handleDirections = () => {
    if (!isAccepted) return
    if (host) {
      void openHostDirections({
        latitude: host.latitude,
        longitude: host.longitude,
        name: formatHostDisplayName(host.name),
        address: booking.address,
      })
      return
    }
    void openDirections({ address: booking.address, label: booking.hostName })
  }

  const openLoadChat = () => {
    openChat(booking.id, booking.id)
  }

  const sendTransferProof = async () => {
    if (!user || !transferProofUri) return

    await sendMessage({
      threadId: booking.id,
      text: buildPaymentProofChatNotice(amount),
      imageUri: transferProofUri,
      booking,
      paymentProof: true,
    })
    markPaymentProofSent(booking.id, transferProofUri)
    setTransferProofUri(null)
  }

  return (
    <Screen>
      <BackButton onPress={() => navigate('customer-home')} label="Home" />
      <NotificationBellReminder compact onPressBell={() => navigate('notifications')} />

      {activeGuestBookings.length > 1 && (
        <View style={styles.loadSwitcher}>
          <Text style={styles.loadSwitcherLabel}>{toTitleCase('Your loads')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.loadSwitcherRow}
          >
            {activeGuestBookings.map((load) => {
              const selected = load.id === booking.id
              return (
                <Pressable
                  key={load.id}
                  onPress={() => selectGuestBooking(load.id)}
                  style={[styles.loadChip, selected && styles.loadChipActive]}
                >
                  <Text
                    style={[styles.loadChipTitle, selected && styles.loadChipTitleActive]}
                    numberOfLines={1}
                  >
                    {load.hostName}
                  </Text>
                  <Text style={[styles.loadChipMeta, selected && styles.loadChipMetaActive]}>
                    {load.loads} load{load.loads === 1 ? '' : 's'} · {getLoadStatusLabel(load)}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      )}

      {needsPayNow && (
        <View style={styles.urgentPayCard}>
          <View style={styles.urgentPayHeader}>
            <View style={styles.urgentPayBadge}>
              <AppIcon name="alert-circle" size={16} color={colors.white} />
              <Text style={styles.urgentPayBadgeText}>{toTitleCase('Pay now')}</Text>
            </View>
            <Text style={styles.urgentPayAmount}>{formatMoney(amount)}</Text>
          </View>
          <Text style={styles.urgentPayTitle}>
            {titleCaseWithName(`${booking.hostName} needs your bank transfer`, booking.hostName)}
          </Text>
          <Text style={styles.urgentPaySub}>
            {toTitleCase('Transfer the amount below, attach your receipt, and submit proof so drying can start.')}
          </Text>
          {bank?.accountNumber?.trim() ? (
            <View style={styles.bankBlock}>
              <Text style={styles.bankLine}>{bank.bankName}</Text>
              <Text style={styles.bankLine}>{bank.accountName}</Text>
              <Text style={styles.bankAccount}>{bank.accountNumber}</Text>
            </View>
          ) : null}
          <TransferProofCapture photoUri={transferProofUri} onPhotoChange={setTransferProofUri} />
          {booking.paymentProofUri && !transferProofUri ? (
            <Text style={styles.paymentHint}>
              {toTitleCase('Proof already submitted. Your host can view it from this load or in chat.')}
            </Text>
          ) : null}
          <PrimaryButton
            title={transferProofUri ? 'Submit transfer proof' : 'Add screenshot first'}
            icon="check-circle"
            full
            disabled={!transferProofUri}
            onPress={() => void sendTransferProof()}
          />
          <OutlineButton title="Message host" icon="message-circle" full onPress={openLoadChat} />
        </View>
      )}

      {cashPayAtDropOff && (
        <View style={styles.urgentPayCard}>
          <View style={styles.urgentPayHeader}>
            <View style={styles.urgentPayBadge}>
              <AppIcon name="dollar-sign" size={16} color={colors.white} />
              <Text style={styles.urgentPayBadgeText}>{toTitleCase('Pay at drop-off')}</Text>
            </View>
            <Text style={styles.urgentPayAmount}>{formatMoney(amount)}</Text>
          </View>
          <Text style={styles.urgentPayTitle}>
            {titleCaseWithName(cashPaymentGuestHint(booking.hostName), booking.hostName)}
          </Text>
          <Text style={styles.urgentPaySub}>
            {toTitleCase('Your host confirms cash in the app before drying starts.')}
          </Text>
          <OutlineButton title="Message host" icon="message-circle" full onPress={openLoadChat} />
        </View>
      )}

      {proofWaitingConfirm && (
        <View style={styles.proofWaitingCard}>
          <AppIcon name="clock" size={18} color={colors.gray600} />
          <View style={styles.proofWaitingCopy}>
            <Text style={styles.proofWaitingTitle}>{toTitleCase('Proof sent')}</Text>
            <Text style={styles.proofWaitingSub}>
              {titleCaseWithName(
                `${booking.hostName} is confirming your transfer — drying starts once payment is verified.`,
                booking.hostName,
              )}
            </Text>
          </View>
          <OutlineButton title="Message host" icon="message-circle" full onPress={openLoadChat} />
        </View>
      )}

      {booking.isNew && !isDeclined && bannerVisible && (
        <Pressable onPress={() => setBannerVisible(false)} style={styles.success}>
          <View style={styles.successIcon}>
            <AppIcon name="check" size={18} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>
              {isPending ? toTitleCase('Request sent') : toTitleCase('Request accepted')}
            </Text>
            <Text style={styles.successSub}>
              {isPending
                ? titleCaseWithName(
                    `Waiting for ${booking.hostName} to accept your load`,
                    booking.hostName,
                  )
                : isBankTransfer && amount > 0
                  ? titleCaseWithName(
                      `Next: drop off at ${booking.address}. Use the Pay now section when ready.`,
                      booking.address,
                    )
                  : isCash && amount > 0
                    ? titleCaseWithName(
                        `Next: drop off at ${booking.address} and pay ${formatMoney(amount)} in cash.`,
                        booking.address,
                      )
                    : titleCaseWithName(
                        `Next: drop off at ${booking.address}.`,
                        booking.address,
                      )}
            </Text>
          </View>
          <AppIcon name="x" size={16} color={colors.gray500} />
        </Pressable>
      )}

      {isDeclined && (
        <View style={styles.declinedCard}>
          <AppIcon name="x-circle" size={18} color={colors.danger} />
          <View style={styles.pendingBody}>
            <Text style={styles.declinedTitle}>{toTitleCase('Request declined')}</Text>
            <Text style={styles.pendingSub}>
              {titleCaseWithName(
                `${booking.hostName} couldn't take your load. Try another nearby host.`,
                booking.hostName,
              )}
            </Text>
          </View>
          <PrimaryButton title="Find another host" icon="search" onPress={() => { clearBooking(); navigate('customer-home') }} full />
        </View>
      )}

      {isCash && booking.paymentStatus === 'paid' && isAccepted && (
        <View style={styles.paidCard}>
          <AppIcon name="check-circle" size={18} color={colors.green} />
          <Text style={styles.paidText}>{toTitleCase('Cash confirmed at drop-off')} · {formatMoney(amount)}</Text>
        </View>
      )}

      {isBankTransfer && booking.paymentStatus === 'paid' && isAccepted && (
        <View style={styles.paidCard}>
          <AppIcon name="check-circle" size={18} color={colors.green} />
          <Text style={styles.paidText}>{toTitleCase('Transfer verified')} · {formatMoney(amount)}</Text>
        </View>
      )}

      {!isDeclined && (
        <View style={styles.progressSection}>
          <View style={styles.statusHeader}>
            <AppIcon name="package" size={20} color={colors.gray500} />
            <Text style={styles.eyebrow}>{toTitleCase('Load progress')}</Text>
            <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
          </View>

          <LoadProgressTracker booking={booking} pulse={pulse} />
        </View>
      )}

      {!isDeclined && isPending && (
        <View style={styles.infoCard}>
          <AppIcon name="message-circle" size={18} color={colors.gray600} />
          <Text style={styles.infoText}>
            {titleCaseWithName(
              `Step 1: waiting for ${booking.hostName} to accept your request.`,
              booking.hostName,
            )}
          </Text>
        </View>
      )}

      {!isDeclined && isPending && (
        <View style={styles.cancelCard}>
          <View style={styles.cancelHeader}>
            <AppIcon name="clock" size={18} color={colors.gray600} />
            <Text style={styles.cancelTitle}>
              {canCancelPending ? toTitleCase('No response yet') : toTitleCase('Waiting for host')}
            </Text>
          </View>
          <Text style={styles.cancelSub}>
            {canCancelPending
              ? toTitleCase('You can cancel this request if you no longer need a dryer.')
              : `${toTitleCase('You can cancel if the host has not responded within 30 minutes')} (${formatCancelCountdown(msUntilCancel)} ${toTitleCase('remaining')}).`}
          </Text>
          <OutlineButton
            title="Cancel request"
            icon="x-circle"
            full
            disabled={!canCancelPending}
            onPress={() => cancelPendingRequest(booking.id)}
          />
          <OutlineButton title="Message host" icon="message-circle" full onPress={openLoadChat} />
        </View>
      )}

      {!isDeclined && booking.clothesList && booking.clothesList.length > 0 && (
        <View style={styles.clothesSection}>
          <LoadListBreakdown items={booking.clothesList} title="Your load list" />
        </View>
      )}

      {!isDeclined && !isPending && !isReadyForPickup && !needsPayNow && !proofWaitingConfirm && !cashPayAtDropOff && (
      <View style={styles.infoCard}>
        <AppIcon name="message-circle" size={18} color={colors.gray600} />
        <Text style={styles.infoText}>
          {toTitleCase(`Step ${progressStep.number} of 6 — ${getGuestStepDescription(booking, progressStep)}`)}
        </Text>
      </View>
      )}

      {isDropOffPhase && (
      <View style={styles.pickupCard}>
        <View style={styles.pickupTitleRow}>
          <AppIcon name="map-pin" size={18} />
          <Text style={styles.pickupTitle}>{toTitleCase('Drop-off details')}</Text>
        </View>
        <View style={styles.pickupField}>
          <AppIcon name="home" size={14} color={colors.gray500} />
          <View style={styles.pickupFieldText}>
            <Text style={styles.pickupLabel}>{toTitleCase('Address')}</Text>
            <Text style={styles.pickupValue}>{booking.address}</Text>
          </View>
        </View>
        <View style={styles.pickupField}>
          <AppIcon name="key" size={14} color={colors.gray500} />
          <View style={styles.pickupFieldText}>
            <Text style={styles.pickupLabel}>{toTitleCase('Gate code')}</Text>
            <Text style={styles.pickupValue}>{booking.gateCode}</Text>
          </View>
        </View>
        <View style={{ height: spacing.md }} />
        <OutlineButton title="Directions" icon="navigation" full onPress={handleDirections} />
        <OutlineButton title="Message host" icon="message-circle" full onPress={openLoadChat} />
      </View>
      )}

      {isReadyForPickup && (
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <AppIcon name="star" size={18} color={colors.black} />
            <Text style={styles.reviewTitle}>{toTitleCase('Ready For Pickup')}</Text>
          </View>
          <Text style={styles.reviewSub}>
            {titleCaseWithName(
              `After you collect your laundry, confirm pickup and leave a review for ${booking.hostName}.`,
              booking.hostName,
            )}
          </Text>
          <PrimaryButton title="I Picked Up My Load" icon="check-circle" full onPress={handleConfirmPickup} />
        </View>
      )}

      {isPending && (
        <View style={styles.pickupCard}>
          <View style={styles.pickupTitleRow}>
            <AppIcon name="map-pin" size={18} color={colors.gray400} />
            <Text style={[styles.pickupTitle, styles.pickupTitleMuted]}>{toTitleCase('Drop-off details')}</Text>
          </View>
          <Text style={styles.pendingDirectionsHint}>
            {titleCaseWithName(
              `Drop-off address and directions unlock after ${booking.hostName} accepts your request.`,
              booking.hostName,
            )}
          </Text>
          <OutlineButton title="Directions" icon="navigation" full disabled onPress={() => {}} />
        </View>
      )}
    </Screen>
  )
}

function createTrackingStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.sm },
  emptySub: { fontSize: 14, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 20 },
  loadSwitcher: { marginBottom: spacing.lg, gap: spacing.sm },
  loadSwitcherLabel: { fontSize: 13, color: colors.gray500, letterSpacing: 0.4 },
  loadSwitcherRow: { gap: spacing.sm, paddingRight: spacing.md },
  loadChip: {
    minWidth: 140,
    maxWidth: 200,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  loadChipActive: {
    borderColor: colors.black,
    backgroundColor: colors.black,
  },
  loadChipTitle: { fontSize: 14, fontWeight: '700', color: colors.black },
  loadChipTitleActive: { color: colors.white },
  loadChipMeta: { fontSize: 12, color: colors.gray600, marginTop: 2 },
  loadChipMetaActive: { color: 'rgba(255,255,255,0.85)' },
  success: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.greenBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,138,5,0.15)',
  },
  successIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontWeight: '600', fontSize: 15, lineHeight: 20 },
  successSub: { fontSize: 13, color: colors.gray600, marginTop: spacing.sm, lineHeight: 18 },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  pendingBody: { flex: 1 },
  pendingTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  pendingSub: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  declinedCard: {
    gap: spacing.md,
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  declinedTitle: { fontSize: 16, fontWeight: '700', color: colors.danger, marginBottom: 4 },
  bankBlock: { gap: 2, marginVertical: spacing.sm },
  bankLine: { fontSize: 14, fontWeight: '600' },
  bankAccount: { fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  paymentCard: {
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    backgroundColor: colors.gray50,
  },
  urgentPayCard: {
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  urgentPayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  urgentPayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.black,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  urgentPayBadgeText: { fontSize: 13, fontWeight: '700', color: colors.white },
  urgentPayAmount: { fontSize: 28, fontWeight: '800', color: colors.black, letterSpacing: -0.5 },
  urgentPayTitle: { fontSize: 17, fontWeight: '700', color: colors.black, lineHeight: 24 },
  urgentPaySub: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  paymentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  paymentTitle: { fontSize: 16, fontWeight: '700' },
  paymentSub: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  paymentHint: { fontSize: 12, color: colors.gray500, lineHeight: 18, textAlign: 'center' },
  paymentWarn: { fontSize: 13, color: colors.danger },
  paidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.greenBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  paidText: { fontSize: 14, fontWeight: '600', color: colors.green },
  proofWaitingCard: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  proofWaitingCopy: { gap: 4 },
  proofWaitingTitle: { fontSize: 16, fontWeight: '700', color: colors.black },
  proofWaitingSub: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    paddingBottom: spacing.sm,
  },
  progressSection: { gap: spacing.md, marginBottom: spacing.lg },
  eyebrow: { fontSize: 13, color: colors.gray500, letterSpacing: 0.4 },
  clothesSection: { marginBottom: spacing.lg },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  cancelCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.md,
  },
  cancelHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cancelTitle: { fontSize: 16, fontWeight: '700' },
  cancelSub: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  infoText: { fontSize: 14, color: colors.gray600, lineHeight: 22, flex: 1 },
  pickupCard: {
    backgroundColor: colors.gray50,
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pickupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pickupTitle: { fontSize: 16, fontWeight: '600' },
  pickupTitleMuted: { color: colors.gray500 },
  pendingDirectionsHint: { fontSize: 14, color: colors.gray500, lineHeight: 20 },
  pickupField: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  pickupFieldText: { flex: 1 },
  pickupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray500,
    letterSpacing: 0.5,
  },
  pickupValue: { fontSize: 16, fontWeight: '500', marginTop: spacing.sm, lineHeight: 22 },
  reviewCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.md,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewTitle: { fontSize: 16, fontWeight: '700' },
  reviewSub: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  })
}
