import { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { LoadListBreakdown } from '../../components/LoadListBreakdown'
import { BackButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  formatMoney,
  formatPaymentMethod,
  getBookingAmount,
  sumBookingAmounts,
  bookingExtrasSummary,
} from '../../lib/bookingPayments'
import { DRYER_SHEETS_PRICE, formatDryerSheetsPerLoadCharge } from '../../lib/hostPricing'
import {
  loadCustomerPaymentHistory,
  loadHostPaymentHistory,
} from '../../lib/paymentHistoryStorage'
import { radius, spacing } from '../../theme'
import { formatDropOffHour } from '../../lib/dropOffAvailability'
import { toTitleCase } from '../../lib/titleCase'
import { type Booking } from '../../types'

function createHistoryStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    title: { fontSize: 26, fontWeight: '700', lineHeight: 32, color: colors.black },
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
    summaryLabel: { fontSize: 13, fontWeight: '600', color: colors.gray500, letterSpacing: 0.4 },
    summaryAmount: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5, color: colors.black },
    summaryMeta: { flexDirection: 'row', gap: spacing.lg },
    summaryMetaText: { fontSize: 13, color: colors.gray600, fontWeight: '500' },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md, color: colors.black },
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
    ledgerTitle: { fontSize: 15, fontWeight: '600', color: colors.black },
    ledgerSub: { fontSize: 12, color: colors.gray500 },
    ledgerAmount: { fontSize: 16, fontWeight: '700', color: colors.black },
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
    cardTitle: { fontSize: 16, fontWeight: '600', flex: 1, color: colors.black },
    amount: { fontSize: 18, fontWeight: '700', color: colors.black },
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
    emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.black },
    emptySub: { fontSize: 14, color: colors.gray500, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.lg },
  })
}

function PaymentStatusBadge({
  status,
  paymentMethod,
  styles,
}: {
  status?: Booking['paymentStatus']
  paymentMethod?: Booking['paymentMethod']
  styles: ReturnType<typeof createHistoryStyles>
}) {
  const paid = status === 'paid'
  return (
    <View style={[styles.statusBadge, paid ? styles.statusPaid : styles.statusPending]}>
      <Text style={[styles.statusText, paid ? styles.statusTextPaid : styles.statusTextPending]}>
        {paid ? toTitleCase('Paid') : toTitleCase('Pending')}
      </Text>
    </View>
  )
}

function HistoryCard({
  item,
  isCustomer,
  styles,
  colors,
}: {
  item: Booking
  isCustomer: boolean
  styles: ReturnType<typeof createHistoryStyles>
  colors: ReturnType<typeof useTheme>['colors']
}) {
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
        <PaymentStatusBadge status={item.paymentStatus} paymentMethod={item.paymentMethod} styles={styles} />
      </View>

      {item.pricePerLoad != null && item.loads > 1 && (
        <Text style={styles.breakdown}>
          {formatMoney(item.pricePerLoad)} dry × {item.loads}
          {item.sheetsOption === 'buy'
            ? ` · sheets ${formatDryerSheetsPerLoadCharge(item.sheetsPrice ?? DRYER_SHEETS_PRICE)} × ${item.loads}`
            : ''}
          {item.foldingService ? ` · folding ${formatMoney(item.foldingPrice ?? 0)} × ${item.loads}` : ''}
        </Text>
      )}

      {bookingExtrasSummary(item) && (
        <Text style={styles.breakdown}>{bookingExtrasSummary(item)}</Text>
      )}

      {item.clothesList && item.clothesList.length > 0 ? (
        <LoadListBreakdown
          items={item.clothesList}
          title={isCustomer ? 'Your load list' : "Guest's load list"}
        />
      ) : null}

      {item.completedAt ? (
        <View style={styles.metaRow}>
          <AppIcon name="calendar" size={14} color={colors.gray500} />
          <Text style={styles.metaText}>{item.completedAt}</Text>
        </View>
      ) : null}
    </View>
  )
}

function PaymentLedgerRow({
  item,
  styles,
}: {
  item: Booking
  styles: ReturnType<typeof createHistoryStyles>
}) {
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
  const { colors } = useTheme()
  const styles = useMemo(() => createHistoryStyles(colors), [colors])
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
          {toTitleCase(isCustomer ? 'Past loads & payments' : 'Load history')}
        </Text>
      </View>
      <Text style={styles.subtitle}>
        {isCustomer
          ? toTitleCase('Every load you book and pay for on Laundry Buddy')
          : toTitleCase('Loads you have hosted for neighbors')}
      </Text>

      {history.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryMain}>
            <Text style={styles.summaryLabel}>
              {toTitleCase(isCustomer ? 'Total spent' : 'Total earned')}
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
              {paidCount} {toTitleCase('paid')}
            </Text>
          </View>
        </View>
      )}

      {history.length === 0 ? (
        <View style={styles.empty}>
          <AppIcon name="inbox" size={32} color={colors.gray400} />
          <Text style={styles.emptyTitle}>{toTitleCase('No history yet')}</Text>
          <Text style={styles.emptySub}>
            {isCustomer
              ? toTitleCase('Completed loads and payments will show up here.')
              : toTitleCase('Completed loads you host will appear here.')}
          </Text>
        </View>
      ) : (
        history.map((item) => (
          <HistoryCard key={item.id} item={item} isCustomer={isCustomer} styles={styles} colors={colors} />
        ))
      )}
    </Screen>
  )
}
