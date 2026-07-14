import { Linking, StyleSheet, Text, View } from 'react-native'
import { useApp } from '../../context/AppContext'
import { SEED_HOSTS } from '../../data/seedData'
import { BackButton, OutlineButton, PrimaryButton, Screen } from '../../components/ui'
import { colors, radius, spacing } from '../../theme'
import type { BookingStage } from '../../types'

const STAGES: { key: BookingStage; label: string; desc: string }[] = [
  { key: 'got-bag', label: 'Got bag', desc: 'Host received your laundry' },
  { key: 'waiting', label: 'Waiting', desc: 'Queued for the dryer' },
  { key: 'drying', label: 'Drying', desc: 'Your load is in the dryer' },
  { key: 'ready', label: 'Ready', desc: 'Pick up anytime' },
]

export function TrackingScreen() {
  const { booking, navigate } = useApp()

  if (!booking) {
    return (
      <Screen style={styles.empty}>
        <Text style={styles.emptyTitle}>No active booking</Text>
        <Text style={styles.emptySub}>Find a host to get started</Text>
        <PrimaryButton title="Explore dryers" onPress={() => navigate('customer-home')} full />
      </Screen>
    )
  }

  const stageIndex = STAGES.findIndex((s) => s.key === booking.stage)
  const current = STAGES[stageIndex]
  const host = SEED_HOSTS.find((h) => h.id === booking.hostId)
  const whatsapp = host?.whatsapp ?? '5016001234'

  return (
    <Screen>
      <BackButton onPress={() => navigate('customer-home')} label="Home" />

      {booking.isNew && (
        <View style={styles.success}>
          <Text style={styles.successCheck}>✓</Text>
          <View>
            <Text style={styles.successTitle}>Booking confirmed</Text>
            <Text style={styles.successSub}>Drop off at {booking.address}</Text>
          </View>
        </View>
      )}

      <Text style={styles.eyebrow}>Your load</Text>
      <Text style={styles.statusTitle}>{current.label}</Text>
      <Text style={styles.statusSub}>{current.desc} · with {booking.hostName}</Text>

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
                <Text style={[styles.timelineLabel, (done || active) && styles.timelineLabelActive]}>
                  {stage.label}
                </Text>
                {time && <Text style={styles.timelineTime}>{time}</Text>}
              </View>
            </View>
          )
        })}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>We'll notify you on WhatsApp when it's ready.</Text>
      </View>

      <View style={styles.pickupCard}>
        <Text style={styles.pickupTitle}>Pickup details</Text>
        <Text style={styles.pickupLabel}>Address</Text>
        <Text style={styles.pickupValue}>{booking.address}</Text>
        <Text style={[styles.pickupLabel, { marginTop: spacing.md }]}>Gate code</Text>
        <Text style={styles.pickupValue}>{booking.gateCode}</Text>
        <View style={{ height: spacing.md }} />
        <OutlineButton
          title="Message host"
          full
          onPress={() =>
            Linking.openURL(
              `https://wa.me/${whatsapp}?text=Hi%20${booking.hostName}!%20Checking%20on%20my%20load.`,
            )
          }
        />
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
    backgroundColor: colors.greenBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,138,5,0.15)',
  },
  successCheck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.green,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 36,
    fontWeight: '700',
  },
  successTitle: { fontWeight: '600', fontSize: 15, lineHeight: 20 },
  successSub: { fontSize: 13, color: colors.gray600, marginTop: spacing.sm, lineHeight: 18 },
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
  timelineLabel: { fontSize: 15, color: colors.gray400, fontWeight: '500' },
  timelineLabelActive: { color: colors.black, fontWeight: '600' },
  timelineTime: { fontSize: 13, color: colors.gray500 },
  infoCard: {
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  infoText: { fontSize: 14, color: colors.gray600, lineHeight: 22 },
  pickupCard: {
    backgroundColor: colors.gray50,
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  pickupTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  pickupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickupValue: { fontSize: 16, fontWeight: '500', marginTop: spacing.sm, lineHeight: 22 },
})
