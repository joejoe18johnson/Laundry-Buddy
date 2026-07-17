import { Animated, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import {
  GUEST_LOAD_STEPS,
  getGuestProgressIndex,
  getProgressPercent,
  getStepTimestamp,
  type GuestProgressStep,
} from '../lib/loadProgress'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'
import type { Booking } from '../types'

type LoadProgressTrackerProps = {
  booking: Booking
  pulse: Animated.Value
}

function StepNode({
  step,
  state,
  pulse,
}: {
  step: GuestProgressStep
  state: 'done' | 'active' | 'upcoming'
  pulse: Animated.Value
}) {
  const isDone = state === 'done'
  const isActive = state === 'active'

  return (
    <View style={styles.nodeWrap}>
      <Animated.View
        style={[
          styles.node,
          isDone && styles.nodeDone,
          isActive && styles.nodeActive,
          isActive && { transform: [{ scale: pulse }] },
        ]}
      >
        {isDone ? (
          <AppIcon name="check" size={12} color={colors.white} />
        ) : (
          <Text style={[styles.nodeNumber, isActive && styles.nodeNumberActive]}>{step.number}</Text>
        )}
      </Animated.View>
      <Text
        style={[styles.nodeLabel, isDone && styles.nodeLabelDone, isActive && styles.nodeLabelActive]}
        numberOfLines={2}
      >
        {toTitleCase(step.label)}
      </Text>
    </View>
  )
}

export function LoadProgressTracker({ booking, pulse }: LoadProgressTrackerProps) {
  const activeIndex = getGuestProgressIndex(booking)
  const currentStep = GUEST_LOAD_STEPS[Math.max(0, Math.min(activeIndex, GUEST_LOAD_STEPS.length - 1))]
  const progressPercent = getProgressPercent(activeIndex, GUEST_LOAD_STEPS.length)
  const isComplete = booking.stage === 'picked-up'

  return (
    <View style={styles.card}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryEyebrow}>
            {isComplete
              ? toTitleCase('Load complete')
              : toTitleCase(`Step ${currentStep.number} of ${GUEST_LOAD_STEPS.length}`)}
          </Text>
          <Text style={styles.summaryTitle}>
            {isComplete ? toTitleCase('Picked up') : toTitleCase(currentStep.label)}
          </Text>
          <Text style={styles.summarySub}>
            {isComplete
              ? toTitleCase('Thanks for using Laundry Buddy')
              : toTitleCase(currentStep.description)}
          </Text>
        </View>
        <View style={styles.percentBadge}>
          <Text style={styles.percentValue}>{isComplete ? '100' : progressPercent}%</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${isComplete ? 100 : progressPercent}%` }]} />
      </View>

      <View style={styles.stepperRow}>
        {GUEST_LOAD_STEPS.map((step, index) => {
          const state =
            isComplete || index < activeIndex
              ? 'done'
              : index === activeIndex
                ? 'active'
                : 'upcoming'
          return <StepNode key={step.key} step={step} state={state} pulse={pulse} />
        })}
      </View>

      <View style={styles.detailList}>
        {GUEST_LOAD_STEPS.map((step, index) => {
          const state =
            isComplete || index < activeIndex
              ? 'done'
              : index === activeIndex
                ? 'active'
                : 'upcoming'
          const time = getStepTimestamp(booking, step)

          return (
            <View key={`detail-${step.key}`} style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View
                  style={[
                    styles.detailDot,
                    state === 'done' && styles.detailDotDone,
                    state === 'active' && styles.detailDotActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.detailDotText,
                      (state === 'done' || state === 'active') && styles.detailDotTextActive,
                    ]}
                  >
                    {step.number}
                  </Text>
                </View>
                {index < GUEST_LOAD_STEPS.length - 1 && (
                  <View style={[styles.detailLine, state === 'done' && styles.detailLineDone]} />
                )}
              </View>
              <View style={styles.detailBody}>
                <View style={styles.detailHeader}>
                  <AppIcon
                    name={step.icon}
                    size={15}
                    color={state === 'upcoming' ? colors.gray400 : colors.black}
                  />
                  <Text style={[styles.detailLabel, state !== 'upcoming' && styles.detailLabelActive]}>
                    {toTitleCase(step.label)}
                  </Text>
                  {state === 'active' && !isComplete && (
                    <View style={styles.nowBadge}>
                      <Text style={styles.nowBadgeText}>{toTitleCase('Now')}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.detailDesc}>{toTitleCase(step.description)}</Text>
                {time ? <Text style={styles.detailTime}>{time}</Text> : null}
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  summaryCopy: { flex: 1, gap: 4 },
  summaryEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray500,
    letterSpacing: 0.4,
  },
  summaryTitle: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  summarySub: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  percentBadge: {
    minWidth: 52,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.black,
    alignItems: 'center',
  },
  percentValue: { fontSize: 14, fontWeight: '700', color: colors.white },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.gray100,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.black,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  nodeWrap: { flex: 1, alignItems: 'center', gap: 6, minWidth: 0 },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: { backgroundColor: colors.black },
  nodeActive: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
  },
  nodeNumber: { fontSize: 12, fontWeight: '700', color: colors.gray500 },
  nodeNumberActive: { color: colors.black },
  nodeLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.gray400,
    textAlign: 'center',
    lineHeight: 12,
  },
  nodeLabelDone: { color: colors.gray600 },
  nodeLabelActive: { color: colors.black },
  detailList: { gap: 0 },
  detailRow: { flexDirection: 'row', minHeight: 64 },
  detailLeft: { width: 32, alignItems: 'center' },
  detailDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailDotDone: { backgroundColor: colors.black },
  detailDotActive: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
  },
  detailDotText: { fontSize: 11, fontWeight: '700', color: colors.gray500 },
  detailDotTextActive: { color: colors.black },
  detailLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.gray100,
    marginVertical: 4,
  },
  detailLineDone: { backgroundColor: colors.black },
  detailBody: { flex: 1, paddingLeft: spacing.sm, paddingBottom: spacing.md },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  detailLabel: { fontSize: 15, fontWeight: '500', color: colors.gray400 },
  detailLabelActive: { color: colors.black, fontWeight: '700' },
  detailDesc: { fontSize: 13, color: colors.gray500, lineHeight: 18, marginTop: 2 },
  detailTime: { fontSize: 12, color: colors.gray500, marginTop: 4, fontWeight: '600' },
  nowBadge: {
    backgroundColor: colors.black,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  nowBadgeText: { fontSize: 10, fontWeight: '700', color: colors.white },
})
