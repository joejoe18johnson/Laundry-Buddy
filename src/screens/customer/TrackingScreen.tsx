import { Linking, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { getHostById } from '../../data/mockData'
import { applyHostListing } from '../../lib/hostListing'
import { getBookingAmount, formatMoney, formatPaymentMethod } from '../../lib/bookingPayments'
import { buildTransferProofMessage, sendTransferProofViaWhatsApp } from '../../lib/whatsapp'
import { BackButton, OutlineButton, PrimaryButton, Screen } from '../../components/ui'
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
  const transferPending = isBankTransfer && booking.paymentStatus === 'pending' && amount > 0

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

      {booking.isNew && (
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <AppIcon name="check" size={18} color={colors.white} />
          </View>
          <View>
            <Text style={styles.successTitle}>Booking confirmed</Text>
            <Text style={styles.successSub}>Drop off at {booking.address}</Text>
          </View>
        </View>
      )}

      {transferPending && (
        <View style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <AppIcon name="credit-card" size={18} />
            <Text style={styles.paymentTitle}>Bank transfer — {formatMoney(amount)}</Text>
          </View>
          <Text style={styles.paymentSub}>
            Send {booking.hostName} your transfer proof on WhatsApp so they can verify payment.
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

      {isBankTransfer && booking.paymentStatus === 'paid' && (
        <View style={styles.paidCard}>
          <AppIcon name="check-circle" size={18} color={colors.green} />
          <Text style={styles.paidText}>Transfer verified · {formatMoney(amount)}</Text>
        </View>
      )}

      <View style={styles.statusHeader}>
        <AppIcon name="package" size={20} color={colors.gray500} />
        <Text style={styles.eyebrow}>Your load</Text>
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
                <View
                  style={[
                    styles.dot,
                    done && styles.dotDone,
                    active && styles.dotActive,
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

      <View style={styles.infoCard}>
        <AppIcon name="message-circle" size={18} color={colors.gray600} />
        <Text style={styles.infoText}>
          {transferPending
            ? 'Message your host on WhatsApp with your transfer screenshot.'
            : "We'll notify you when your load is ready."}
        </Text>
      </View>

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
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
