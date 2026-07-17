import { useEffect, useRef, useState } from 'react'
import { Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { TransferProofCapture } from '../../components/TransferProofCapture'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { getHostById } from '../../data/mockData'
import { applyHostListing } from '../../lib/hostListing'
import { getBookingAmount, formatMoney } from '../../lib/bookingPayments'
import {
  buildTransferProofMessage,
  formatWhatsAppDisplay,
  sendTransferProofViaWhatsApp,
} from '../../lib/whatsapp'
import { openDirections, openHostDirections } from '../../lib/openDirections'
import { LoadProgressTracker } from '../../components/LoadProgressTracker'
import { BackButton, OutlineButton, PrimaryButton, Screen, StatusBadge } from '../../components/ui'
import { getGuestProgressStep } from '../../lib/loadProgress'
import {
  canGuestCancelPendingRequest,
  formatCancelCountdown,
  getMsUntilGuestCanCancel,
} from '../../lib/pendingRequestCancel'
import { titleCaseWithName, toTitleCase } from '../../lib/titleCase'
import { LoadListBreakdown } from '../../components/LoadListBreakdown'
import { colors, radius, spacing } from '../../theme'

export function TrackingScreen() {
  const { user } = useAuth()
  const { booking, navigate, getSettingsForHost, confirmPickup, openLeaveReview, clearBooking, cancelPendingRequest } = useApp()
  const [bannerVisible, setBannerVisible] = useState(true)
  const [transferProofUri, setTransferProofUri] = useState<string | null>(null)
  const [cancelTick, setCancelTick] = useState(0)
  const pulse = useRef(new Animated.Value(1)).current

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
        <Text style={styles.emptyTitle}>{toTitleCase('No active booking')}</Text>
        <Text style={styles.emptySub}>{toTitleCase('Find a host to get started')}</Text>
        <PrimaryButton title="Explore dryers" icon="search" onPress={() => navigate('customer-home')} full />
      </Screen>
    )
  }

  const progressStep = getGuestProgressStep(booking)
  const host = getHostById(booking.hostId)
  const hostSettings = getSettingsForHost(host?.hostUserId)
  const resolvedHost = host ? applyHostListing(host, hostSettings) : null
  const whatsapp = resolvedHost?.whatsapp ?? host?.whatsapp ?? ''
  const amount = getBookingAmount(booking)
  const isBankTransfer = booking.paymentMethod === 'bank_transfer'
  const isAccepted = booking.requestStatus !== 'pending' && booking.requestStatus !== 'declined'
  const isPending = booking.requestStatus === 'pending'
  const isDeclined = booking.requestStatus === 'declined'
  const transferPending = isAccepted && isBankTransfer && booking.paymentStatus === 'pending' && amount > 0
  const bank = hostSettings.bankDetails

  const isReadyForPickup = isAccepted && booking.stage === 'ready'
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
          : transferPending
            ? { label: 'Pay now', variant: 'pending' as const }
            : { label: 'Accepted', variant: 'accepted' as const }

  const handleDirections = () => {
    if (!isAccepted) return
    if (host) {
      void openHostDirections({
        latitude: host.latitude,
        longitude: host.longitude,
        name: host.name,
        address: booking.address,
      })
      return
    }
    void openDirections({ address: booking.address, label: booking.hostName })
  }

  const sendTransferProof = () => {
    if (!whatsapp || !user) return
    const message = buildTransferProofMessage({
      guestName: user.name,
      hostName: booking.hostName,
      amount,
      loads: booking.loads,
      bookingId: booking.id,
      bankName: hostSettings.bankDetails.bankName,
      accountNumber: hostSettings.bankDetails.accountNumber,
      hasScreenshot: !!transferProofUri,
    })
    void sendTransferProofViaWhatsApp(whatsapp, message, transferProofUri)
  }

  return (
    <Screen>
      <BackButton onPress={() => navigate('customer-home')} label="Home" />

      {booking.isNew && !isDeclined && bannerVisible && (
        <Pressable onPress={() => setBannerVisible(false)} style={styles.success}>
          <View style={styles.successIcon}>
            <AppIcon name="check" size={18} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>
              {isPending ? toTitleCase('Request sent') : toTitleCase('Booking confirmed')}
            </Text>
            <Text style={styles.successSub}>
              {isPending
                ? titleCaseWithName(
                    `Waiting for ${booking.hostName} to accept your load`,
                    booking.hostName,
                  )
                : titleCaseWithName(`Drop off at ${booking.address}`, booking.address)}
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

      {transferPending && (
        <View style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <AppIcon name="credit-card" size={18} />
            <Text style={styles.paymentTitle}>{toTitleCase('Bank transfer')} — {formatMoney(amount)}</Text>
          </View>
          {bank?.accountNumber?.trim() ? (
            <View style={styles.bankBlock}>
              <Text style={styles.bankLine}>{bank.bankName}</Text>
              <Text style={styles.bankLine}>{bank.accountName}</Text>
              <Text style={styles.bankAccount}>{bank.accountNumber}</Text>
            </View>
          ) : null}
          <Text style={styles.paymentSub}>
            {titleCaseWithName(
              `Transfer the amount above, add your receipt screenshot, then send proof to ${booking.hostName} on WhatsApp${whatsapp ? ` (${formatWhatsAppDisplay(whatsapp)}).` : '.'}`,
              booking.hostName,
            )}
          </Text>
          <TransferProofCapture photoUri={transferProofUri} onPhotoChange={setTransferProofUri} />
          {whatsapp ? (
            <PrimaryButton
              title={transferProofUri ? 'Send proof on WhatsApp' : 'Open WhatsApp to send proof'}
              icon="message-circle"
              full
              onPress={sendTransferProof}
            />
          ) : (
            <Text style={styles.paymentWarn}>{toTitleCase('Host has not added a WhatsApp number yet.')}</Text>
          )}
          {transferProofUri ? (
            <Text style={styles.paymentHint}>
              {toTitleCase('Choose WhatsApp on the share sheet, then send the screenshot to your host.')}
            </Text>
          ) : null}
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
              `Step 1 is complete once ${booking.hostName} accepts. You'll see drop-off details and live updates here.`,
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
        </View>
      )}

      {!isDeclined && booking.clothesList && booking.clothesList.length > 0 && (
        <View style={styles.clothesSection}>
          <LoadListBreakdown items={booking.clothesList} title="Your load list" />
        </View>
      )}

      {!isDeclined && !isPending && !isReadyForPickup && !transferPending && (
      <View style={styles.infoCard}>
        <AppIcon name="message-circle" size={18} color={colors.gray600} />
        <Text style={styles.infoText}>
          {toTitleCase(`Step ${progressStep.number} of 6 — ${progressStep.description}`)}
        </Text>
      </View>
      )}

      {isAccepted && (
      <View style={styles.pickupCard}>
        <View style={styles.pickupTitleRow}>
          <AppIcon name="map-pin" size={18} />
          <Text style={styles.pickupTitle}>{toTitleCase('Pickup details')}</Text>
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
        {whatsapp ? (
          <OutlineButton
            title="Message host"
            icon="message-circle"
            full
            onPress={() =>
              Linking.openURL(
                `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hi ${booking.hostName}! Checking on my load.`,
                )}`,
              )
            }
          />
        ) : null}
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
            <Text style={[styles.pickupTitle, styles.pickupTitleMuted]}>{toTitleCase('Pickup details')}</Text>
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

const styles = StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.sm },
  emptySub: { fontSize: 14, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 20 },
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
    backgroundColor: '#fff5f5',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.2)',
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
