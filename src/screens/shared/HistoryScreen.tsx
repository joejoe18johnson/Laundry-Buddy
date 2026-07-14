import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { getCustomerHistory, getHostHistory } from '../../data/mockData'
import { colors, radius, spacing } from '../../theme'
import { DROP_OFF_LABELS, type Booking } from '../../types'

function HistoryCard({ item, isCustomer }: { item: Booking; isCustomer: boolean }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <AppIcon name="check-circle" size={18} color={colors.green} />
        <Text style={styles.cardTitle}>{item.location}</Text>
      </View>
      <Text style={styles.cardSub}>
        {isCustomer ? `Hosted by ${item.hostName}` : `Guest: ${item.customerName}`}
      </Text>
      <View style={styles.metaRow}>
        <AppIcon name="package" size={14} color={colors.gray500} />
        <Text style={styles.metaText}>
          {item.loads} load{item.loads > 1 ? 's' : ''} · {DROP_OFF_LABELS[item.dropOffTime]}
        </Text>
      </View>
      {item.completedAt ? (
        <View style={styles.metaRow}>
          <AppIcon name="calendar" size={14} color={colors.gray500} />
          <Text style={styles.metaText}>{item.completedAt}</Text>
        </View>
      ) : null}
    </View>
  )
}

export function HistoryScreen() {
  const { user } = useAuth()
  const { navigate } = useApp()

  if (!user) return null

  const isCustomer = user.role === 'customer'
  const history = isCustomer ? getCustomerHistory(user.id) : getHostHistory(user.id)
  const backScreen = isCustomer ? 'customer-home' : 'host-dashboard'

  return (
    <Screen>
      <BackButton onPress={() => navigate(backScreen)} label="Back" />
      <View style={styles.titleRow}>
        <AppIcon name="clock" size={22} />
        <Text style={styles.title}>{isCustomer ? 'Past loads' : 'Load history'}</Text>
      </View>
      <Text style={styles.subtitle}>
        {isCustomer
          ? 'Dryers you have used in the Cayo Area'
          : 'Loads you have hosted for neighbors'}
      </Text>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <AppIcon name="inbox" size={32} color={colors.gray400} />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySub}>
            {isCustomer
              ? 'Your completed loads will show up here.'
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
  card: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  cardSub: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySub: { fontSize: 14, color: colors.gray500, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.lg },
})
