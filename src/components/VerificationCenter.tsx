import { useMemo, type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { useTheme } from '../context/ThemeContext'
import {
  getVerificationTrackSteps,
  verificationCenterHeadline,
  verificationCenterSubtitle,
  type VerificationTrackStep,
} from '../lib/identityVerification'
import { toTitleCase } from '../lib/titleCase'
import { radius, spacing } from '../theme'
import type { User, VerificationStatus } from '../types'

type WizardStep = 'phone' | 'id' | 'address'

type VerificationCenterProps = {
  user: User
  status: VerificationStatus
  wizardStep?: WizardStep
  children?: ReactNode
  footer?: ReactNode
}

export function VerificationCenter({ user, status, wizardStep, children, footer }: VerificationCenterProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const steps = useMemo(
    () => getVerificationTrackSteps(user, { wizardStep }),
    [user, wizardStep],
  )
  const doneCount = steps.filter((step) => step.state === 'done').length
  const progressPercent = Math.round((doneCount / steps.length) * 100)

  return (
    <View style={styles.wrap}>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={[styles.statusPill, statusPillStyle(status, colors)]}>
            <AppIcon name={statusIcon(status)} size={12} color={statusPillTextColor(status, colors)} />
            <Text style={[styles.statusPillText, { color: statusPillTextColor(status, colors) }]}>
              {toTitleCase(statusPillLabel(status))}
            </Text>
          </View>
          <Text style={styles.percent}>{progressPercent}%</Text>
        </View>
        <Text style={styles.title}>{toTitleCase(verificationCenterHeadline(status, user.role))}</Text>
        <Text style={styles.subtitle}>{toTitleCase(verificationCenterSubtitle(status, user.role))}</Text>
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>{toTitleCase('Your progress')}</Text>
        {steps.map((step, index) => (
          <TrackRow key={step.key} step={step} isLast={index === steps.length - 1} styles={styles} colors={colors} />
        ))}
      </View>

      {status === 'pending' ? (
        <View style={styles.hintCard}>
          <AppIcon name="clock" size={18} color={colors.gray600} />
          <Text style={styles.hintText}>
            {toTitleCase(
              user.role === 'host'
                ? 'We are verifying your address and identification documents. Usually done within 30 mins.'
                : 'We are verifying your identification documents. Usually done within 30 mins.',
            )}
          </Text>
        </View>
      ) : null}

      {children ? <View style={styles.content}>{children}</View> : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  )
}

function TrackRow({
  step,
  isLast,
  styles,
  colors,
}: {
  step: VerificationTrackStep
  isLast: boolean
  styles: ReturnType<typeof createStyles>
  colors: ReturnType<typeof useTheme>['colors']
}) {
  const done = step.state === 'done'
  const active = step.state === 'active' || step.state === 'waiting'

  return (
    <View style={styles.trackRow}>
      <View style={styles.trackLeft}>
        <View
          style={[
            styles.trackDot,
            done && styles.trackDotDone,
            active && styles.trackDotActive,
            step.state === 'waiting' && styles.trackDotWaiting,
          ]}
        >
          {done ? (
            <AppIcon name="check" size={12} color={colors.white} />
          ) : step.state === 'waiting' ? (
            <AppIcon name="clock" size={12} color={colors.black} />
          ) : active ? (
            <View style={styles.trackDotInner} />
          ) : null}
        </View>
        {!isLast ? <View style={[styles.trackLine, done && styles.trackLineDone]} /> : null}
      </View>
      <View style={styles.trackBody}>
        <Text style={[styles.trackLabel, (done || active) && styles.trackLabelActive]}>
          {toTitleCase(step.label)}
        </Text>
        {step.detail ? <Text style={styles.trackDetail}>{step.detail}</Text> : null}
        {step.state === 'waiting' ? (
          <Text style={styles.trackMeta}>{toTitleCase('In progress')}</Text>
        ) : null}
        {step.state === 'active' && step.key === 'review' ? (
          <Text style={styles.trackMeta}>{toTitleCase('Complete the steps below')}</Text>
        ) : null}
      </View>
    </View>
  )
}

function statusIcon(status: VerificationStatus) {
  if (status === 'verified') return 'check-circle'
  if (status === 'pending') return 'clock'
  if (status === 'rejected') return 'x-circle'
  return 'shield'
}

function statusPillLabel(status: VerificationStatus) {
  if (status === 'verified') return 'Verified'
  if (status === 'pending') return 'Under review'
  if (status === 'rejected') return 'Action needed'
  return 'In progress'
}

function statusPillStyle(status: VerificationStatus, colors: ReturnType<typeof useTheme>['colors']) {
  if (status === 'verified') return { backgroundColor: colors.greenBg, borderColor: colors.green }
  if (status === 'pending') return { backgroundColor: colors.gray50, borderColor: colors.gray200 }
  if (status === 'rejected') return { backgroundColor: colors.gray50, borderColor: colors.danger }
  return { backgroundColor: colors.gray50, borderColor: colors.gray200 }
}

function statusPillTextColor(status: VerificationStatus, colors: ReturnType<typeof useTheme>['colors']) {
  if (status === 'verified') return colors.green
  if (status === 'rejected') return colors.danger
  return colors.gray600
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    wrap: { gap: spacing.lg },
    headerCard: {
      borderWidth: 1,
      borderColor: colors.gray200,
      borderRadius: radius.lg,
      padding: spacing.lg,
      backgroundColor: colors.white,
      gap: spacing.sm,
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    statusPillText: { fontSize: 12, fontWeight: '700' },
    percent: { fontSize: 14, fontWeight: '700', color: colors.black },
    title: { fontSize: 26, fontWeight: '700', lineHeight: 32, color: colors.black },
    subtitle: { fontSize: 15, color: colors.gray600, lineHeight: 22 },
    track: {
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.gray100,
      overflow: 'hidden',
      marginTop: spacing.sm,
    },
    trackFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.black },
    progressCard: {
      borderWidth: 1,
      borderColor: colors.gray200,
      borderRadius: radius.lg,
      padding: spacing.lg,
      backgroundColor: colors.gray50,
      gap: spacing.md,
    },
    progressTitle: { fontSize: 13, fontWeight: '700', color: colors.gray500, letterSpacing: 0.4 },
    trackRow: { flexDirection: 'row', gap: spacing.md },
    trackLeft: { width: 28, alignItems: 'center' },
    trackDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.gray200,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trackDotDone: { backgroundColor: colors.green },
    trackDotActive: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.black },
    trackDotWaiting: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.gray400 },
    trackDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.black },
    trackLine: {
      flex: 1,
      width: 2,
      backgroundColor: colors.gray200,
      marginVertical: 4,
      minHeight: 20,
    },
    trackLineDone: { backgroundColor: colors.green },
    trackBody: { flex: 1, paddingBottom: spacing.sm, gap: 2 },
    trackLabel: { fontSize: 15, fontWeight: '600', color: colors.gray400, lineHeight: 20 },
    trackLabelActive: { color: colors.black },
    trackDetail: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
    trackMeta: { fontSize: 12, fontWeight: '600', color: colors.gray500, marginTop: 2 },
    hintCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.gray50,
      borderWidth: 1,
      borderColor: colors.gray200,
      padding: spacing.md,
      borderRadius: radius.md,
    },
    hintText: { flex: 1, fontSize: 14, color: colors.gray600, lineHeight: 20 },
    content: { gap: spacing.md },
    footer: { gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  })
}
