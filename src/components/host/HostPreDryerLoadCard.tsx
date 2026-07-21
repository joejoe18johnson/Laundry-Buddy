import { useState, type ReactNode } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../AppIcon'
import { ImageLightbox } from '../ImageLightbox'
import { PaymentProofChip } from '../PaymentProofChip'
import { LoadListBreakdown } from '../LoadListBreakdown'
import { HostLoadProgress } from '../HostLoadProgress'
import { formatDropOffHour } from '../../lib/dropOffAvailability'
import type { DropOffHour } from '../../lib/dropOffAvailability'
import { formatMoney, getBookingAmount, cashPaymentHostHint } from '../../lib/bookingPayments'
import { stageBadge } from '../../lib/hostLoads'
import { toTitleCase } from '../../lib/titleCase'
import { GhostButton, PrimaryButton, StatusBadge, SuccessButton } from '../ui'
import { useTheme } from '../../context/ThemeContext'
import { radius, spacing } from '../../theme'
import type { Booking } from '../../types'

function GuestCardHeader({
  name,
  metaParts,
  statusBadge,
  styles,
}: {
  name: string
  metaParts: string[]
  statusBadge?: ReactNode
  styles: ReturnType<typeof createStyles>
}) {
  const { colors } = useTheme()
  return (
    <View style={styles.guestHeader}>
      <View style={styles.avatar}>
        <AppIcon name="user" size={18} color={colors.gray600} />
      </View>
      <View style={styles.guestHeaderBody}>
        <View style={styles.guestTitleRow}>
          <Text style={styles.cardTitle}>{name}</Text>
          {statusBadge}
        </View>
        <View style={styles.metaRow}>
          {metaParts.map((part) => (
            <View key={part} style={styles.metaPill}>
              <Text style={styles.metaPillText}>{part}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

function OrderDetails({
  dropOffTime,
  notes,
  paymentMethod,
  totalAmount,
  loadPhotoUri,
  styles,
}: {
  dropOffTime: DropOffHour
  notes?: string
  paymentMethod?: 'cash' | 'bank_transfer'
  totalAmount?: number
  loadPhotoUri?: string
  styles: ReturnType<typeof createStyles>
}) {
  const { colors } = useTheme()
  const trimmedNotes = notes?.trim()

  return (
    <View style={styles.orderDetails}>
      {loadPhotoUri ? (
        <View style={styles.photoBlock}>
          <View style={styles.notesHeader}>
            <AppIcon name="camera" size={14} color={colors.gray600} />
            <Text style={styles.notesLabel}>{toTitleCase('Guest load photo')}</Text>
          </View>
          <Image source={{ uri: loadPhotoUri }} style={styles.loadPhoto} resizeMode="cover" />
        </View>
      ) : null}
      <View style={styles.detailRow}>
        <View style={styles.detailIcon}>
          <AppIcon name="clock" size={16} color={colors.black} />
        </View>
        <View style={styles.detailBody}>
          <Text style={styles.detailLabel}>{toTitleCase('Guest drop-off time')}</Text>
          <Text style={styles.detailValue}>{formatDropOffHour(dropOffTime)}</Text>
          <Text style={styles.detailHint}>{toTitleCase('Expect laundry during this window')}</Text>
        </View>
      </View>
      {trimmedNotes ? (
        <View style={styles.notesBox}>
          <View style={styles.notesHeader}>
            <AppIcon name="message-square" size={14} color={colors.gray600} />
            <Text style={styles.notesLabel}>{toTitleCase('Guest notes')}</Text>
          </View>
          <Text style={styles.notesText}>{trimmedNotes}</Text>
        </View>
      ) : (
        <Text style={styles.noNotes}>{toTitleCase('No special instructions from guest')}</Text>
      )}
      {paymentMethod && (
        <Text style={styles.paymentMeta}>
          {paymentMethod === 'cash' ? toTitleCase('Pay at drop-off') : toTitleCase('Bank transfer after acceptance')}
          {totalAmount != null && totalAmount > 0 ? ` · ${formatMoney(totalAmount)}` : ''}
        </Text>
      )}
    </View>
  )
}

type Props = {
  load: Booking
  onConfirmPayment: (loadId: string) => void
  onStartDrying: (loadId: string) => void
  onMessageGuest: (loadId: string) => void
}

export function HostPreDryerLoadCard({
  load,
  onConfirmPayment,
  onStartDrying,
  onMessageGuest,
}: Props) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [proofLightboxUri, setProofLightboxUri] = useState<string | null>(null)

  return (
    <>
      <View style={styles.card}>
        <GuestCardHeader
          name={load.customerName}
          metaParts={[
            `${load.loads} load${load.loads === 1 ? '' : 's'}`,
            formatDropOffHour(load.dropOffTime),
            load.paymentMethod === 'cash' ? 'Cash · Drop-off' : 'Transfer',
            load.paymentMethod === 'bank_transfer' &&
            load.paymentStatus === 'pending' &&
            load.paymentRequestedAt &&
            !load.paymentProofSentAt
              ? 'Awaiting payment'
              : load.paymentProofSentAt
                ? 'Proof sent'
                : '',
          ].filter(Boolean)}
          statusBadge={<StatusBadge {...stageBadge(load.stage)} />}
          styles={styles}
        />
        <HostLoadProgress load={load} />
        {load.clothesList && load.clothesList.length > 0 ? (
          <LoadListBreakdown items={load.clothesList} title="Guest's load list" />
        ) : null}
        <OrderDetails
          dropOffTime={load.dropOffTime}
          notes={load.notes}
          paymentMethod={load.paymentMethod}
          totalAmount={load.totalAmount}
          loadPhotoUri={load.loadPhotoUri}
          styles={styles}
        />
        {load.paymentProofUri ? (
          <PaymentProofChip
            confirmed={load.paymentStatus === 'paid'}
            onPress={() => setProofLightboxUri(load.paymentProofUri!)}
          />
        ) : null}
        {load.paymentMethod === 'bank_transfer' && load.paymentStatus === 'pending' && (
          <>
            <Text style={styles.transferHint}>
              {load.paymentProofUri || load.paymentProofSentAt
                ? toTitleCase('Review the transfer proof below, then confirm once verified.')
                : load.paymentRequestedAt
                  ? toTitleCase('Waiting for guest to transfer and submit proof from My loads.')
                  : toTitleCase('Payment request will send automatically when you accept bank-transfer loads.')}
            </Text>
            {(load.paymentProofUri || load.paymentProofSentAt) && (
              <GhostButton
                title={`Confirm ${formatMoney(getBookingAmount(load))} received`}
                icon="check-circle"
                full
                onPress={() => onConfirmPayment(load.id)}
              />
            )}
          </>
        )}
        {load.paymentMethod === 'cash' && load.paymentStatus === 'pending' && (load.totalAmount ?? 0) > 0 && (
          <>
            <Text style={styles.transferHint}>{toTitleCase(cashPaymentHostHint())}</Text>
            <PrimaryButton
              title={`Confirm ${formatMoney(getBookingAmount(load))} cash at drop-off`}
              icon="check-circle"
              full
              onPress={() => onConfirmPayment(load.id)}
            />
          </>
        )}
        {load.paymentMethod === 'bank_transfer' && load.paymentStatus === 'paid' && (
          <SuccessButton title="Payment confirmed" icon="check-circle" full disabled />
        )}
        {load.paymentMethod === 'cash' && load.paymentStatus === 'paid' && (
          <SuccessButton title="Cash confirmed at drop-off" icon="check-circle" full disabled />
        )}
        {load.paymentStatus === 'paid' && (
          <PrimaryButton
            title="Start drying"
            icon="wind"
            full
            onPress={() => onStartDrying(load.id)}
          />
        )}
        <GhostButton
          title="Message guest"
          icon="message-circle"
          full
          onPress={() => onMessageGuest(load.id)}
        />
      </View>
      <ImageLightbox
        visible={!!proofLightboxUri}
        imageUri={proofLightboxUri}
        onClose={() => setProofLightboxUri(null)}
      />
    </>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: colors.black,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.md,
      backgroundColor: colors.white,
    },
    guestHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    guestHeaderBody: { flex: 1, minWidth: 0, gap: spacing.sm },
    guestTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    metaPill: {
      borderWidth: 1,
      borderColor: colors.gray200,
      backgroundColor: colors.gray50,
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    metaPillText: { fontSize: 12, fontWeight: '600', color: colors.gray600, lineHeight: 16 },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.gray100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
    orderDetails: {
      backgroundColor: colors.gray50,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    detailIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    detailBody: { flex: 1 },
    detailLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.gray500,
      letterSpacing: 0.4,
    },
    detailValue: { fontSize: 16, fontWeight: '700', marginTop: 2, lineHeight: 22 },
    detailHint: { fontSize: 12, color: colors.gray500, marginTop: 2 },
    notesBox: {
      backgroundColor: colors.white,
      borderRadius: radius.sm,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.gray100,
      gap: 4,
    },
    notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    notesLabel: { fontSize: 11, fontWeight: '700', color: colors.gray600 },
    notesText: { fontSize: 14, color: colors.black, lineHeight: 20 },
    noNotes: { fontSize: 13, color: colors.gray500, fontStyle: 'italic' },
    paymentMeta: { fontSize: 13, color: colors.gray600, fontWeight: '600' },
    photoBlock: { gap: spacing.sm },
    loadPhoto: {
      width: '100%',
      height: 160,
      borderRadius: radius.sm,
      backgroundColor: colors.gray100,
    },
    transferHint: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
  })
}
