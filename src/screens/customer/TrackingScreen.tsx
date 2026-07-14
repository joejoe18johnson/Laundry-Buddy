import { useEffect, useRef, useState } from 'react'
import { Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { getHostById } from '../../data/mockData'
import { applyHostListing } from '../../lib/hostListing'
import { getBookingAmount, formatMoney, formatPaymentMethod } from '../../lib/bookingPayments'
import { buildTransferProofMessage, sendTransferProofViaWhatsApp } from '../../lib/whatsapp'
import { openDirections, openHostDirections } from '../../lib/openDirections'
import { BackButton, OutlineButton, PrimaryButton, Screen, StatusBadge } from '../../components/ui'
import { colors, radius, spacing } from '../../theme'
import type { BookingStage } from '../../types'

const STAGES: { key: BookingStage; label: string; desc: string; icon: 'shopping-bag' | 'clock' | 'wind' | 'check-circle' }[] = [
  { key: 'got-bag', label: 'Got bag', desc: 'Host received your laundry', icon: 'shopping-bag' },
  { key: 'waiting', label: 'Waiting', desc: 'Queued for the dryer', icon: 'clock' },
  { key: 'drying', label: 'Drying', desc: 'Your load is in the dryer', icon: 'wind' },
  { key: 'ready', label: 'Ready', desc: 'Pick up anytime', icon: 'check-circle' },
]

export function TrackingScreen() {
  const { user } = useAuth()
  const { booking, navigate, getSettingsForHost } = useApp()
  const [bannerVisible, setBannerVisible] = useState(true)
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    setBannerVisible(true)
  }, [booking?.id])

  useEffect(() => {
    if (!booking?.isNew || booking.requestStatus === 'declined') return
    const timer = setTimeout(() => setBannerVisible(false), 6000)
    return () => clearTimeout(timer)
  }, [booking?.id, booking?.isNew, booking?.requestStatus])

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
        <Text style={styles.emptyTitle}>No active booking</Text>
        <Text style={styles.emptySub}>Find a host to get started</Text>
        <PrimaryButton title="Explore dryers" icon="search" onPress={() => navigate('customer-home')} full />
      </Screen>
    )
  }

  const stageIndex = STAGES.findIndex((s) => s.key === booking.stage)
  const current = STAGES[stageIndex]
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
    sendTransferProofViaWhatsApp(
      whatsapp,
      buildTransferProofMessage({
        guestName: user.name,
        hostName: booking.hostName,
        amount,
        loads: booking.loads,
        bookingId: booking.id,
        bankName: hostSettings.bankDetails.bankName,
        accountNumber: hostSettings.bankDetails.accountNumber,
      }),
    )
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
              {isPending ? 'Request sent' : 'Booking confirmed'}
            </Text>
            <Text style={styles.successSub}>
              {isPending
                ? `Waiting for ${booking.hostName} to accept your load`
                : `Drop off at ${booking.address}`}
            </Text>
          </View>
          <AppIcon name="x" size={16} color={colors.gray500} />
        </Pressable>
      )}

      {isPending && (
        <View style={styles.pendingCard}>
          <AppIcon name="clock" size={18} color={colors.gray600} />
          <View style={styles.pendingBody}>
            <Text style={styles.pendingTitle}>Awaiting host acceptance</Text>
            <Text style={styles.pendingSub}>
              {booking.hostName} is reviewing your request. You'll get a notification when they accept — bank transfer details will appear then.
            </Text>
          </View>
        </View>
      )}

      {!isDeclined && (
        <PrimaryButton
          title="Directions"
          icon="navigation"
          full
          onPress={handleDirections}
          style={styles.directionsBtn}
        />
      )}

      {isDeclined && (
        <View style={styles.declinedCard}>
          <AppIcon name="x-circle" size={18} color={colors.danger} />
          <View style={styles.pendingBody}>
            <Text style={styles.declinedTitle}>Request declined</Text>
            <Text style={styles.pendingSub}>
              {booking.hostName} couldn't take your load. Try another nearby host.
            </Text>
          </View>
          <PrimaryButton title="Find another host" icon="search" onPress={() => navigate('customer-home')} full />
        </View>
      )}

      {transferPending && (
        <View style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <AppIcon name="credit-card" size={18} />
            <Text style={styles.paymentTitle}>Bank transfer — {formatMoney(amount)}</Text>
          </View>
          {bank?.accountNumber?.trim() ? (
            <View style={styles.bankBlock}>
              <Text style={styles.bankLine}>{bank.bankName}</Text>
              <Text style={styles.bankLine}>{bank.accountName}</Text>
              <Text style={styles.bankAccount}>{bank.accountNumber}</Text>
            </View>
          ) : null}
          <Text style={styles.paymentSub}>
            Transfer the amount above, then send {booking.hostName} your proof on WhatsApp.
          </Text>
          {whatsapp ? (
            <OutlineButton
              title="Send proof via WhatsApp"
              icon="message-circle"
              full
              onPress={sendTransferProof}
            />
          ) : (
            <Text style={styles.paymentWarn}>Host has not added a WhatsApp number yet.</Text>
          )}
        </View>
      )}

      {isBankTransfer && booking.paymentStatus === 'paid' && isAccepted && (
        <View style={styles.paidCard}>
          <AppIcon name="check-circle" size={18} color={colors.green} />
          <Text style={styles.paidText}>Transfer verified · {formatMoney(amount)}</Text>
        </View>
      )}

      {!isPending && !isDeclined && (
        <>
      <View style={styles.statusHeader}>
        <AppIcon name="package" size={20} color={colors.gray500} />
        <Text style={styles.eyebrow}>Your load</Text>
        <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
      </View>
      <Text style={styles.statusTitle}>{current.label}</Text>
      <Text style={styles.statusSub}>
        {current.desc} · with {booking.hostName}
        {booking.paymentMethod ? ` · ${formatPaymentMethod(booking.paymentMethod)}` : ''}
      </Text>

      <View style={styles.timeline}>
        {STAGES.map((stage, i) => {
          const done = i < stageIndex
          const active = i === stageIndex
          const time = booking.stageTimes[stage.key]
          return (
            <View key={stage.key} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <Animated.View
                  style={[
                    styles.dot,
                    done && styles.dotDone,
                    active && styles.dotActive,
                    active && { transform: [{ scale: pulse }] },
                  ]}
                />
                {i < STAGES.length - 1 && (
                  <View style={[styles.line, done && styles.lineDone]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineLabelRow}>
                  <AppIcon
                    name={stage.icon}
                    size={16}
                    color={done || active ? colors.black : colors.gray400}
                  />
                  <Text style={[styles.timelineLabel, (done || active) && styles.timelineLabelActive]}>
                    {stage.label}
                  </Text>
                </View>
                {time && <Text style={styles.timelineTime}>{time}</Text>}
              </View>
            </View>
          )
        })}
      </View>
        </>
      )}

      {!isDeclined && (
      <View style={styles.infoCard}>
        <AppIcon name="message-circle" size={18} color={colors.gray600} />
        <Text style={styles.infoText}>
          {isPending
            ? "We'll notify you as soon as the host accepts your request."
            : transferPending
              ? 'Message your host on WhatsApp with your transfer screenshot.'
              : "We'll notify you when your load is ready."}
        </Text>
      </View>
      )}

      {isAccepted && (
      <View style={styles.pickupCard}>
        <View style={styles.pickupTitleRow}>
          <AppIcon name="map-pin" size={18} />
          <Text style={styles.pickupTitle}>Pickup details</Text>
        </View>
        <View style={styles.pickupField}>
          <AppIcon name="home" size={14} color={colors.gray500} />
          <View style={styles.pickupFieldText}>
            <Text style={styles.pickupLabel}>Address</Text>
            <Text style={styles.pickupValue}>{booking.address}</Text>
          </View>
        </View>
        <View style={styles.pickupField}>
          <AppIcon name="key" size={14} color={colors.gray500} />
          <View style={styles.pickupFieldText}>
            <Text style={styles.pickupLabel}>Gate code</Text>
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
  directionsBtn: { marginBottom: spacing.lg },
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
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  eyebrow: { fontSize: 13, color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.4 },
  statusTitle: { fontSize: 32, fontWeight: '700', marginVertical: spacing.sm, lineHeight: 38 },
  statusSub: { fontSize: 15, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
  timeline: { marginBottom: spacing.lg },
  timelineRow: { flexDirection: 'row', minHeight: 56 },
  timelineLeft: { width: 24, alignItems: 'center' },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gray200,
    marginTop: 4,
  },
  dotDone: { backgroundColor: colors.black },
  dotActive: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
  },
  line: { flex: 1, width: 2, backgroundColor: colors.gray100, marginVertical: 4 },
  lineDone: { backgroundColor: colors.black },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    paddingLeft: spacing.md,
  },
  timelineLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timelineLabel: { fontSize: 15, color: colors.gray400, fontWeight: '500' },
  timelineLabelActive: { color: colors.black, fontWeight: '600' },
  timelineTime: { fontSize: 13, color: colors.gray500 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  infoText: { fontSize: 14, color: colors.gray600, lineHeight: 22, flex: 1 },
  pickupCard: {
    backgroundColor: colors.gray50,
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  pickupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pickupTitle: { fontSize: 16, fontWeight: '600' },
  pickupField: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  pickupFieldText: { flex: 1 },
  pickupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickupValue: { fontSize: 16, fontWeight: '500', marginTop: spacing.sm, lineHeight: 22 },
})
