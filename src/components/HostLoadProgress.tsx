import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { useTheme } from '../context/ThemeContext'
import {
  HOST_LOAD_STEPS,
  getHostProgressIndex,
  getHostStepDescription,
  getHostStepLabel,
  getProgressPercent,
} from '../lib/loadProgress'
import { isPickupComplete } from '../lib/pickupConfirmation'
import { toTitleCase } from '../lib/titleCase'
import { radius, spacing } from '../theme'
import type { Booking } from '../types'

export function HostLoadProgress({ load }: { load: Booking }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const activeIndex = getHostProgressIndex(load)
  const currentStep = HOST_LOAD_STEPS[Math.min(activeIndex, HOST_LOAD_STEPS.length - 1)]
  const progressPercent = getProgressPercent(activeIndex, HOST_LOAD_STEPS.length)
  const isComplete = load.stage === 'picked-up' || isPickupComplete(load)

  return (
    <View style={styles.card}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCopy}>
          <Text style={styles.eyebrow}>
            {isComplete
              ? toTitleCase('Load complete')
              : toTitleCase(`Step ${Math.min(activeIndex + 1, HOST_LOAD_STEPS.length)} of ${HOST_LOAD_STEPS.length}`)}
          </Text>
          <Text style={styles.title}>
            {isComplete ? toTitleCase('Picked up') : toTitleCase(getHostStepLabel(load, currentStep))}
          </Text>
          <Text style={styles.sub}>
            {isComplete
              ? toTitleCase('All done — ask your guest for a review')
              : toTitleCase(getHostStepDescription(load, currentStep))}
          </Text>
        </View>
        <View style={styles.percentBadge}>
          <Text style={styles.percentValue}>{isComplete ? '100' : progressPercent}%</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${isComplete ? 100 : progressPercent}%` }]} />
      </View>
      <View style={styles.stepsRow}>
        {HOST_LOAD_STEPS.map((step, index) => {
          const done = isComplete || index < activeIndex
          const active = !isComplete && index === activeIndex
          return (
            <View key={step.key} style={styles.stepWrap}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                {done ? (
                  <AppIcon name="check" size={10} color={colors.white} />
                ) : (
                  <Text style={[styles.dotNum, active && styles.dotNumActive]}>{step.number}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, (done || active) && styles.stepLabelActive]} numberOfLines={2}>
                {toTitleCase(getHostStepLabel(load, step))}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: colors.gray200,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.gray50,
    },
    summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    summaryCopy: { flex: 1, gap: 4 },
    eyebrow: { fontSize: 11, fontWeight: '700', color: colors.gray500, letterSpacing: 0.4 },
    title: { fontSize: 17, fontWeight: '700', color: colors.black, lineHeight: 22 },
    sub: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
    percentBadge: {
      minWidth: 44,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.black,
      alignItems: 'center',
    },
    percentValue: { fontSize: 12, fontWeight: '700', color: colors.white },
    track: {
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.gray200,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.black },
    stepsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
    stepWrap: { flex: 1, alignItems: 'center', gap: 4, minWidth: 0 },
    dot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.gray200,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotDone: { backgroundColor: colors.black },
    dotActive: { backgroundColor: colors.black },
    dotNum: { fontSize: 10, fontWeight: '700', color: colors.gray600 },
    dotNumActive: { color: colors.white },
    stepLabel: { fontSize: 9, fontWeight: '600', color: colors.gray400, textAlign: 'center', lineHeight: 12 },
    stepLabelActive: { color: colors.black },
  })
}
