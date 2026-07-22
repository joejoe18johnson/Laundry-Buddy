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
import { loadPaymentProofDraft, savePaymentProofDraft } from '../../lib/paymentProofDraftStorage'
import { LoadProgressTracker } from '../../components/LoadProgressTracker'
import { NotificationBellReminder } from '../../components/NotificationBellReminder'
import { BackButton, OutlineButton, PrimaryButton, Screen, StatusBadge } from '../../components/ui'
import { getGuestProgressStep, getGuestStepDescription } from '../../lib/loadProgress'
import {
  canGuestCancelPendingRequest,
  formatCancelCountdown,
  getMsUntilGuestCanCancel,
} from '../../lib/pendingRequestCancel'
import {
  canGuestConfirmPickup,
  isAwaitingHostPickupConfirmation,
  isPickupComplete,
} from '../../lib/pickupConfirmation'
import { titleCaseWithName, toTitleCase } from '../../lib/titleCase'
import { LoadListBreakdown } from '../../components/LoadListBreakdown'
import { useTheme } from '../../context/ThemeContext'
import { radius, spacing } from '../../theme'
import type { Booking } from '../../types'

function getLoadStatusLabel(load: Booking): string {
  if (load.requestStatus === 'pending') return 'Awaiting'
  if (load.requestStatus === 'declined') return 'Declined'
  if (load.stage === 'picked-up' || isPickupComplete(load)) return 'Complete'
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
  const { booking, activeGuestBookings, selectGuestBooking, navigate, getSettingsForHost, confirmPickup, clearBooking, cancelPendingRequest, openChat, markPaymentProofSent, refreshGuestBookings, openLeaveReview } = useApp()
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
    if (!booking?.id) {
      setTransferProofUri(null)
      return
    }
    let cancelled = false
    void loadPaymentProofDraft(booking.id).then((uri) => {
      if (!cancelled) setTransferProofUri(uri)
    })
    return () => {
      cancelled = true
    }
  }, [booking?.id])

  useEffect(() => {
    if (!booking?.id || !transferProofUri) return
    void savePaymentProofDraft(booking.id, transferProofUri)
  }, [booking?.id, transferProofUri])

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

  const dropOffUnlocked =
    isAccepted &&
    (amount <= 0 || isCash || (isBankTransfer && booking.paymentStatus === 'paid'))
  const showDropOffCard = !isDeclined && !isLoadComplete
  const phaseLocked = !dropOffUnlocked && !isDeclined
  const dropOffAddress = booking.address.trim() || host?.address?.trim() || ''
  const dropOffGate = booking.gateCode.trim() || host?.gateCode?.trim() || ''
  const dropOffLockMessage = isPending
    ? titleCaseWithName(
        `Drop-off address and directions unlock after ${booking.hostName} accepts your request.`,
        booking.hostName,
      )
    : isBankTransfer && booking.paymentStatus !== 'paid'
      ? titleCaseWithName(
          `Drop-off address and directions unlock after ${booking.hostName} verifies your bank transfer.`,
          booking.hostName,
        )
      : ''

  const isReadyForPickup = isAccepted && booking.stage === 'ready' && !isPickupComplete(booking)
  const isLoadComplete = booking.stage === 'picked-up' || isPickupComplete(booking)
  const canConfirmGuestPickup = canGuestConfirmPickup(booking)
  const awaitingHostPickupConfirm = isAwaitingHostPickupConfirmation(booking)
  const canCancelPending = isPending && canGuestCancelPendingRequest(booking)
  const msUntilCancel = isPending ? getMsUntilGuestCanCancel(booking) : 0
  void cancelTick

  const handleConfirmPickup = () => {
    if (!booking || !canGuestConfirmPickup(booking)) return
    confirmPickup(booking.id)
  }

  const statusBadge = isDeclined
    ? { label: 'Declined', variant: 'declined' as const }
    : isLoadComplete
      ? { label: 'Complete', variant: 'accepted' as const }
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
    if (!dropOffUnlocked) return
    if (host) {
      void openHostDirections({
        latitude: host.latitude,
        longitude: host.longitude,
        name: formatHostDisplayName(host.name),
        address: dropOffAddress,
      })
      return
    }
    void openDirections({ address: dropOffAddress, label: booking.hostName })
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
    void savePaymentProofDraft(booking.id, null)
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

      {showDropOffCard ? (
        <View
          style={[
            styles.pickupCard,
            dropOffUnlocked ? styles.pickupCardProminent : styles.pickupCardLocked,
          ]}
        >
          <View style={styles.pickupTitleRow}>
            <AppIcon
              name="map-pin"
              size={18}
              color={dropOffUnlocked ? colors.black : colors.gray400}
            />
            <Text
              style={[styles.pickupTitle, !dropOffUnlocked && styles.pickupTitleMuted]}
            >
              {toTitleCase('Drop-off details')}
            </Text>
            {dropOffUnlocked ? (
              <View style={styles.dropOffLiveBadge}>
                <Text style={styles.dropOffLiveBadgeText}>{toTitleCase('Ready')}</Text>
              </View>
            ) : null}
          </View>

          {!dropOffUnlocked ? (
            <Text style={styles.pendingDirectionsHint}>{dropOffLockMessage}</Text>
          ) : (
            <>
              <View style={styles.pickupField}>
                <AppIcon name="home" size={14} color={colors.gray500} />
                <View style={styles.pickupFieldText}>
                  <Text style={styles.pickupLabel}>{toTitleCase('Address')}</Text>
                  <Text style={styles.pickupValue}>{dropOffAddress || toTitleCase('Ask your host in chat')}</Text>
                </View>
              </View>
              {dropOffGate ? (
                <View style={styles.pickupField}>
                  <AppIcon name="key" size={14} color={colors.gray500} />
                  <View style={styles.pickupFieldText}>
                    <Text style={styles.pickupLabel}>{toTitleCase('Gate code')}</Text>
                    <Text style={styles.pickupValue}>{dropOffGate}</Text>
                  </View>
                </View>
              ) : null}
            </>
          )}

          <OutlineButton
            title="Directions"
            icon="navigation"
            full
            disabled={!dropOffUnlocked || !dropOffAddress}
            onPress={handleDirections}
          />
          <OutlineButton title="Message host" icon="message-circle" full onPress={openLoadChat} />
        </View>
      ) : null}

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
                : isBankTransfer && amount > 0 && !dropOffUnlocked
                  ? toTitleCase('Next: complete your bank transfer below. Drop-off directions unlock once payment is verified.')
                  : isCash && amount > 0
                    ? toTitleCase(`Next: head to drop-off and pay ${formatMoney(amount)} in cash. Directions are above.`)
                    : dropOffUnlocked
                      ? toTitleCase('Drop-off directions are ready at the top of this page.')
                      : toTitleCase('Your host accepted — follow the steps below to continue.')}
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

      <View style={phaseLocked ? styles.lockedPhase : undefined} pointerEvents={phaseLocked ? 'none' : 'auto'}>
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
      </View>

      {isLoadComplete && (
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <AppIcon name="check-circle" size={18} color={colors.green} />
            <Text style={styles.reviewTitle}>{toTitleCase('All done')}</Text>
          </View>
          <Text style={styles.reviewSub}>
            {titleCaseWithName(
              `Step 6 of 6 — your load with ${booking.hostName} is complete. Leave a review to help others find great hosts.`,
              booking.hostName,
            )}
          </Text>
          <PrimaryButton
            title="Leave review"
            icon="star"
            full
            onPress={() => openLeaveReview(booking.hostId, booking.id)}
          />
          <OutlineButton title="Back to home" icon="home" full onPress={() => { clearBooking(); navigate('customer-home') }} />
        </View>
      )}

      {isReadyForPickup && canConfirmGuestPickup && !booking.hostPickupConfirmedAt && (
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <AppIcon name="star" size={18} color={colors.black} />
            <Text style={styles.reviewTitle}>{toTitleCase('Ready For Pickup')}</Text>
          </View>
          <Text style={styles.reviewSub}>
            {titleCaseWithName(
              `After you collect your laundry, confirm pickup so ${booking.hostName} can close out the load. You can leave a review once both of you confirm.`,
              booking.hostName,
            )}
          </Text>
          <PrimaryButton title="I Picked Up My Load" icon="check-circle" full onPress={handleConfirmPickup} />
        </View>
      )}

      {isReadyForPickup && awaitingHostPickupConfirm && (
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <AppIcon name="check-circle" size={18} color={colors.green} />
            <Text style={styles.reviewTitle}>{toTitleCase('Pickup Confirmed')}</Text>
          </View>
          <Text style={styles.reviewSub}>
            {titleCaseWithName(
              `You confirmed pickup. Waiting for ${booking.hostName} to confirm on their end — then you can leave a review.`,
              booking.hostName,
            )}
          </Text>
        </View>
      )}

      {isReadyForPickup && booking.hostPickupConfirmedAt && !booking.guestPickupConfirmedAt && (
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <AppIcon name="package" size={18} color={colors.black} />
            <Text style={styles.reviewTitle}>{toTitleCase('Host Confirmed Pickup')}</Text>
          </View>
          <Text style={styles.reviewSub}>
            {titleCaseWithName(
              `${booking.hostName} confirmed you collected your laundry. Tap below once you have your load.`,
              booking.hostName,
            )}
          </Text>
          <PrimaryButton title="I Picked Up My Load" icon="check-circle" full onPress={handleConfirmPickup} />
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
    borderRadius: radius.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pickupCardProminent: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
  },
  pickupCardLocked: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
    opacity: 0.92,
  },
  pickupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  pickupTitle: { fontSize: 17, fontWeight: '700' },
  pickupTitleMuted: { color: colors.gray500 },
  dropOffLiveBadge: {
    marginLeft: 'auto',
    backgroundColor: colors.greenBg,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(5,148,79,0.25)',
  },
  dropOffLiveBadgeText: { fontSize: 11, fontWeight: '700', color: colors.green },
  pendingDirectionsHint: { fontSize: 14, color: colors.gray500, lineHeight: 20 },
  lockedPhase: { opacity: 0.42 },
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
