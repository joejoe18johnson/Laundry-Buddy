import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import {
  formatMoney,
  formatPaymentMethod,
  getBookingAmount,
  sumBookingAmounts,
  bookingExtrasSummary,
} from '../../lib/bookingPayments'
import {
  loadCustomerPaymentHistory,
  loadHostPaymentHistory,
} from '../../lib/paymentHistoryStorage'
import { colors, radius, spacing } from '../../theme'
import { formatDropOffHour } from '../../lib/dropOffAvailability'
import { type Booking } from '../../types'

function PaymentStatusBadge({ status }: { status?: Booking['paymentStatus'] }) {
  const paid = status === 'paid' || status == null
  return (
    <View style={[styles.statusBadge, paid ? styles.statusPaid : styles.statusPending]}>
      <Text style={[styles.statusText, paid ? styles.statusTextPaid : styles.statusTextPending]}>
        {paid ? 'Paid' : 'Pending'}
      </Text>
    </View>
  )
}

function HistoryCard({ item, isCustomer }: { item: Booking; isCustomer: boolean }) {
  const amount = getBookingAmount(item)

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardHeader}>
          <AppIcon name="check-circle" size={18} color={colors.green} />
          <Text style={styles.cardTitle}>{item.location}</Text>
        </View>
        <Text style={[styles.amount, amount <= 0 && styles.amountFree]}>
          {formatMoney(amount)}
        </Text>
      </View>

      <Text style={styles.cardSub}>
        {isCustomer ? `Hosted by ${item.hostName}` : `Guest: ${item.customerName}`}
      </Text>

      <View style={styles.metaRow}>
        <AppIcon name="package" size={14} color={colors.gray500} />
        <Text style={styles.metaText}>
          {item.loads} load{item.loads > 1 ? 's' : ''} · {formatDropOffHour(item.dropOffTime)}
        </Text>
      </View>

      <View style={styles.paymentRow}>
        <View style={styles.metaRow}>
          <AppIcon name="credit-card" size={14} color={colors.gray500} />
          <Text style={styles.metaText}>{formatPaymentMethod(item.paymentMethod)}</Text>
        </View>
        <PaymentStatusBadge status={item.paymentStatus} />
      </View>

      {item.pricePerLoad != null && item.loads > 1 && (
        <Text style={styles.breakdown}>
          {formatMoney(item.pricePerLoad)} dry × {item.loads}
          {item.sheetsOption === 'buy' ? ` · sheets ${formatMoney(item.sheetsPrice ?? 1)} × ${item.loads}` : ''}
          {item.foldingService ? ` · folding ${formatMoney(item.foldingPrice ?? 0)} × ${item.loads}` : ''}
        </Text>
      )}

      {bookingExtrasSummary(item) && (
        <Text style={styles.breakdown}>{bookingExtrasSummary(item)}</Text>
      )}

      {item.completedAt ? (
        <View style={styles.metaRow}>
          <AppIcon name="calendar" size={14} color={colors.gray500} />
          <Text style={styles.metaText}>{item.completedAt}</Text>
        </View>
      ) : null}
    </View>
  )
}

function PaymentLedgerRow({ item }: { item: Booking }) {
  const amount = getBookingAmount(item)
  return (
    <View style={styles.ledgerRow}>
      <View style={styles.ledgerLeft}>
        <Text style={styles.ledgerTitle}>{item.hostName}</Text>
        <Text style={styles.ledgerSub}>
          {item.completedAt ?? '—'} · {formatPaymentMethod(item.paymentMethod)}
        </Text>
      </View>
      <Text style={[styles.ledgerAmount, amount <= 0 && styles.amountFree]}>
        {formatMoney(amount)}
      </Text>
    </View>
  )
}

export function HistoryScreen() {
  const { user } = useAuth()
  const { navigate, screen } = useApp()
  const [history, setHistory] = useState<Booking[]>([])

  const isCustomer = user!.role === 'customer'
  const backScreen = isCustomer ? 'customer-home' : 'host-dashboard'

  const reload = useCallback(() => {
    if (!user) return
    const loader = isCustomer ? loadCustomerPaymentHistory : loadHostPaymentHistory
    loader(user.id).then(setHistory)
  }, [user, isCustomer])

  useEffect(() => {
    if (screen !== 'history' || !user) return
    reload()
  }, [screen, user, reload])

  const total = sumBookingAmounts(history)
  const paidCount = history.filter((h) => h.paymentStatus !== 'pending').length

  return (
    <Screen>
      <BackButton onPress={() => navigate(backScreen)} label="Back" />
      <View style={styles.titleRow}>
        <AppIcon name={isCustomer ? 'credit-card' : 'clock'} size={22} />
        <Text style={styles.title}>
          {isCustomer ? 'Past loads & payments' : 'Load history'}
        </Text>
      </View>
      <Text style={styles.subtitle}>
        {isCustomer
          ? 'Every load you book and pay for on Laundry Buddy'
          : 'Loads you have hosted for neighbors'}
      </Text>

      {history.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryMain}>
            <Text style={styles.summaryLabel}>
              {isCustomer ? 'Total spent' : 'Total earned'}
            </Text>
            <Text style={[styles.summaryAmount, total <= 0 && styles.amountFree]}>
              {formatMoney(total)}
            </Text>
          </View>
          <View style={styles.summaryMeta}>
            <Text style={styles.summaryMetaText}>
              {history.length} load{history.length !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.summaryMetaText}>
              {paidCount} paid
            </Text>
          </View>
        </View>
      )}

      {isCustomer && history.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Payment history</Text>
          <View style={styles.ledgerCard}>
            {history.map((item) => (
              <PaymentLedgerRow key={`ledger-${item.id}`} item={item} />
            ))}
          </View>
          <Text style={styles.sectionTitle}>Load details</Text>
        </>
      )}

      {history.length === 0 ? (
        <View style={styles.empty}>
          <AppIcon name="inbox" size={32} color={colors.gray400} />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySub}>
            {isCustomer
              ? 'Completed loads and payments will show up here.'
              : 'Completed loads you host will appear here.'}
          </Text>
        </View>
      ) : (
        history.map((item) => (
          <HistoryCard key={item.id} item={item} isCustomer={isCustomer} />
        ))
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
  summaryCard: {
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  summaryMain: { gap: 4 },
  summaryLabel: { fontSize: 13, fontWeight: '600', color: colors.gray500, textTransform: 'capitalize', letterSpacing: 0.4 },
  summaryAmount: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  summaryMeta: { flexDirection: 'row', gap: spacing.lg },
  summaryMetaText: { fontSize: 13, color: colors.gray600, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  ledgerCard: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray100,
    gap: spacing.md,
  },
  ledgerLeft: { flex: 1, gap: 2 },
  ledgerTitle: { fontSize: 15, fontWeight: '600' },
  ledgerSub: { fontSize: 12, color: colors.gray500 },
  ledgerAmount: { fontSize: 16, fontWeight: '700' },
  card: {
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  amount: { fontSize: 18, fontWeight: '700' },
  amountFree: { color: colors.green },
  cardSub: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusPaid: { backgroundColor: colors.greenBg, borderColor: colors.green },
  statusPending: { backgroundColor: colors.gray50, borderColor: colors.gray200 },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextPaid: { color: colors.green },
  statusTextPending: { color: colors.gray600 },
  breakdown: { fontSize: 12, color: colors.gray400 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySub: { fontSize: 14, color: colors.gray500, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.lg },
})
