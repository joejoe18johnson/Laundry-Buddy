import { useMemo } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import { GhostButton, PrimaryButton } from './ui'
import { formatDropOffHour } from '../lib/dropOffAvailability'
import { formatMoney, CASH_PAY_AT_DROP_OFF } from '../lib/bookingPayments'
import { toTitleCase } from '../lib/titleCase'
import { useTheme } from '../context/ThemeContext'
import { radius, spacing } from '../theme'
import { sheetsOptionLabel, type HostRequest } from '../types'

type Props = {
  visible: boolean
  request: HostRequest | null
  queueCount?: number
  onAccept: () => void
  onDecline: () => void
  onLater: () => void
}

export function HostNewRequestPopup({
  visible,
  request,
  queueCount = 0,
  onAccept,
  onDecline,
  onLater,
}: Props) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (!request) return null

  const paymentLabel = request.paymentMethod === 'cash' ? CASH_PAY_AT_DROP_OFF : 'Bank transfer'
  const totalLabel =
    request.totalAmount != null && request.totalAmount > 0
      ? formatMoney(request.totalAmount)
      : toTitleCase('Free load')

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={[styles.overlay, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.card}>
          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <AppIcon name="inbox" size={28} color={colors.white} />
            </View>
            <Text style={styles.kicker}>{toTitleCase('New load request')}</Text>
            <Text style={styles.guestName}>{request.customerName}</Text>
            {queueCount > 1 ? (
              <Text style={styles.queueHint}>
                {toTitleCase(`${queueCount} requests waiting · review one at a time`)}
              </Text>
            ) : null}
          </View>

          <View style={styles.detailGrid}>
            <DetailChip icon="package" label={`${request.loads} load${request.loads === 1 ? '' : 's'}`} styles={styles} />
            <DetailChip icon="clock" label={formatDropOffHour(request.dropOffTime)} styles={styles} />
            <DetailChip icon="map-pin" label={request.location} styles={styles} />
            <DetailChip icon="credit-card" label={paymentLabel} styles={styles} />
            <DetailChip icon="dollar-sign" label={totalLabel} styles={styles} />
            <DetailChip icon="tag" label={sheetsOptionLabel(request.sheetsOption)} styles={styles} />
            {request.foldingService ? (
              <DetailChip icon="layers" label={toTitleCase('Folding requested')} styles={styles} />
            ) : null}
          </View>

          {request.notes?.trim() ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>{toTitleCase('Guest notes')}</Text>
              <Text style={styles.notesText}>{request.notes.trim()}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <PrimaryButton title="Accept load" icon="check-circle" full onPress={onAccept} />
            <GhostButton title="Decline" icon="x" full onPress={onDecline} />
            <Pressable onPress={onLater} hitSlop={8} style={styles.laterBtn}>
              <Text style={styles.laterText}>{toTitleCase('Review on dashboard')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function DetailChip({
  icon,
  label,
  styles,
}: {
  icon: 'package' | 'clock' | 'map-pin' | 'credit-card' | 'dollar-sign' | 'tag' | 'layers'
  label: string
  styles: ReturnType<typeof createStyles>
}) {
  return (
    <View style={styles.chip}>
      <AppIcon name={icon} size={14} />
      <Text style={styles.chipText} numberOfLines={2}>
        {label}
      </Text>
    </View>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      paddingHorizontal: spacing.screen,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    hero: {
      backgroundColor: colors.black,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    kicker: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.72)',
    },
    guestName: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.white,
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    queueHint: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.78)',
      textAlign: 'center',
      lineHeight: 18,
    },
    detailGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      padding: spacing.lg,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.gray50,
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
      maxWidth: '100%',
    },
    chipText: { fontSize: 13, fontWeight: '600', color: colors.gray600, flexShrink: 1 },
    notesBox: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.gray50,
      borderWidth: 1,
      borderColor: colors.gray100,
      gap: 4,
    },
    notesLabel: { fontSize: 12, fontWeight: '700', color: colors.gray500 },
    notesText: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
    actions: { padding: spacing.lg, paddingTop: 0, gap: spacing.sm },
    laterBtn: { alignItems: 'center', paddingVertical: spacing.sm },
    laterText: { fontSize: 14, fontWeight: '600', color: colors.gray500 },
  })
}
