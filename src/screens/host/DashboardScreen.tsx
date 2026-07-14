import { StyleSheet, Text, View } from 'react-native'
import { DROP_OFF_LABELS, SHEETS_LABELS } from '../../types'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { getHostByUserId } from '../../data/mockData'
import { GhostButton, PrimaryButton, Screen } from '../../components/ui'
import { colors, radius, spacing } from '../../theme'

export function DashboardScreen() {
  const { user } = useAuth()
  const {
    hostRequests,
    activeLoads,
    hostStats,
    navigate,
    acceptRequest,
    declineRequest,
    advanceStage,
  } = useApp()

  const hostProfile = user ? getHostByUserId(user.id) : undefined

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{hostProfile?.name ?? user?.name}'s dryer</Text>
        <View style={[styles.pill, hostStats.accepting ? styles.pillLive : null]}>
          <Text style={[styles.pillText, hostStats.accepting ? styles.pillLiveText : null]}>
            {hostStats.accepting ? 'Accepting' : 'Full today'}
          </Text>
        </View>
      </View>
      <Text style={styles.stats}>
        {hostStats.loadsToday} of {hostStats.maxLoads} loads today
      </Text>
      <Text style={styles.sub}>Free bookings — you're helping the community.</Text>

      {hostRequests.map((request) => (
        <View key={request.id} style={styles.section}>
          <Text style={styles.sectionLabel}>New request</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{request.customerName[0]}</Text>
              </View>
              <View>
                <Text style={styles.cardTitle}>{request.customerName}</Text>
                <Text style={styles.cardMeta}>
                  {request.location} · {request.loads} load{request.loads > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.tags}>
              <Text style={styles.tag}>{DROP_OFF_LABELS[request.dropOffTime]}</Text>
              <Text style={styles.tag}>{SHEETS_LABELS[request.sheetsOption]}</Text>
            </View>
            <View style={styles.actions}>
              <PrimaryButton title="Accept" onPress={() => acceptRequest(request.id)} />
              <GhostButton title="Decline" onPress={() => declineRequest(request.id)} />
            </View>
          </View>
        </View>
      ))}

      {activeLoads.map((load) => (
        <View key={load.id} style={styles.section}>
          <Text style={styles.sectionLabel}>Active load</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{load.customerName[0]}</Text>
              </View>
              <View>
                <Text style={styles.cardTitle}>{load.customerName}</Text>
                <Text style={styles.cardMeta}>
                  {load.loads} load · {load.stage.replace('-', ' ')}
                </Text>
              </View>
            </View>
            {(load.stage === 'got-bag' || load.stage === 'waiting') && (
              <PrimaryButton title="Start dryer" onPress={() => advanceStage(load.id, 'drying')} full />
            )}
            {load.stage === 'drying' && (
              <PrimaryButton title="Mark as dry" onPress={() => navigate('host-mark-dry')} full />
            )}
            {load.stage === 'ready' && (
              <Text style={styles.done}>Load complete — customer notified</Text>
            )}
          </View>
        </View>
      ))}

      {hostRequests.length === 0 && activeLoads.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptySub}>No pending requests right now</Text>
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: 22, fontWeight: '700', flex: 1, lineHeight: 28 },
  pill: {
    backgroundColor: colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  pillLive: { backgroundColor: colors.greenBg, borderColor: 'rgba(0,138,5,0.2)' },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.gray600 },
  pillLiveText: { color: colors.green },
  stats: { fontSize: 15, fontWeight: '500', marginBottom: spacing.sm, lineHeight: 22 },
  sub: { fontSize: 14, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 20 },
  section: { marginBottom: spacing.lg },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '600', color: colors.gray600 },
  cardTitle: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  cardMeta: { fontSize: 14, color: colors.gray500, marginTop: spacing.sm, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    fontSize: 12,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    color: colors.gray600,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  done: { color: colors.green, fontWeight: '600', fontSize: 15, lineHeight: 22 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySub: { fontSize: 14, color: colors.gray500, marginTop: spacing.sm, lineHeight: 20 },
})
