import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { DROP_OFF_LABELS, sheetsOptionLabel } from '../../types'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { getHostByUserId } from '../../data/mockData'
import { applyHostPricing } from '../../lib/hostPricing'
import { formatHostPrice } from '../../lib/hostFilters'
import { GhostButton, PrimaryButton, Screen } from '../../components/ui'
import { colors, radius, spacing } from '../../theme'

export function DashboardScreen() {
  const { user } = useAuth()
  const {
    hostRequests,
    activeLoads,
    hostStats,
    hostSettings,
    updateHostSettings,
    navigate,
    acceptRequest,
    declineRequest,
    advanceStage,
  } = useApp()

  const rawHost = user ? getHostByUserId(user.id) : undefined
  const hostProfile = rawHost && hostSettings
    ? applyHostPricing(rawHost, hostSettings)
    : rawHost
  const isOnline = hostSettings?.isOnline ?? false

  const toggleOnline = async (online: boolean) => {
    if (!hostSettings) return
    await updateHostSettings({ ...hostSettings, isOnline: online })
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppIcon name="wind" size={20} />
          <Text style={styles.title}>{hostProfile?.name ?? user?.name}'s dryer</Text>
        </View>
        <Pressable style={styles.hubLink} onPress={() => navigate('account')}>
          <AppIcon name="user" size={16} />
          <Text style={styles.hubLinkText}>Profile</Text>
        </Pressable>
      </View>

      <View style={[styles.onlineBar, isOnline ? styles.onlineBarLive : styles.onlineBarOff]}>
        <View style={styles.onlineLeft}>
          <View style={[styles.onlineDot, isOnline && styles.onlineDotLive]} />
          <View>
            <Text style={styles.onlineTitle}>{isOnline ? 'Online — visible to guests' : 'Offline — hidden from search'}</Text>
            <Text style={styles.onlineSub}>
              {isOnline ? 'Tap to go offline when you are done for the day' : 'Go online to start receiving bookings'}
            </Text>
          </View>
        </View>
        <Switch
          value={isOnline}
          onValueChange={toggleOnline}
          trackColor={{ false: colors.gray200, true: colors.green }}
          thumbColor={colors.white}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statNum}>{hostStats.loadsToday}</Text>
          <Text style={styles.statLabel}>loads today</Text>
        </View>
        <View style={[styles.pill, hostStats.accepting ? styles.pillLive : null]}>
          <AppIcon
            name={hostStats.accepting ? 'check-circle' : 'x-circle'}
            size={12}
            color={hostStats.accepting ? colors.green : colors.gray600}
          />
          <Text style={[styles.pillText, hostStats.accepting ? styles.pillLiveText : null]}>
            {hostStats.accepting ? 'Accepting loads' : 'Full today'}
          </Text>
        </View>
      </View>

      {hostProfile && (
        <Text style={styles.listingMeta}>
          Dry {formatHostPrice(hostProfile.price)}
          {(hostProfile.foldingPrice ?? 0) > 0
            ? ` · Folding ${formatHostPrice(hostProfile.foldingPrice!)}`
            : ''}
          {' · Sheets '}{formatHostPrice(hostProfile.sheetsPrice ?? 1)}
          {' · '}{hostProfile.slotsLeft} slots · ~{hostProfile.turnaroundHours} hr
        </Text>
      )}

      {hostRequests.map((request) => (
        <View key={request.id} style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <AppIcon name="inbox" size={12} color={colors.gray500} />
            <Text style={styles.sectionLabel}>New request</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <AppIcon name="user" size={18} color={colors.gray600} />
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
              <Text style={styles.tag}>{sheetsOptionLabel(request.sheetsOption, hostProfile?.sheetsPrice ?? 1)}</Text>
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
          <View style={styles.sectionLabelRow}>
            <AppIcon name="package" size={12} color={colors.gray500} />
            <Text style={styles.sectionLabel}>Active load</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <AppIcon name="user" size={18} color={colors.gray600} />
              </View>
              <View>
                <Text style={styles.cardTitle}>{load.customerName}</Text>
                <Text style={styles.cardMeta}>
                  {load.loads} load · {load.stage.replace('-', ' ')}
                  {load.paymentMethod ? ` · ${load.paymentMethod === 'cash' ? 'Cash' : 'Transfer'}` : ''}
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
              <Text style={styles.done}>Load complete — guest notified</Text>
            )}
          </View>
        </View>
      ))}

      {hostRequests.length === 0 && activeLoads.length === 0 && (
        <View style={styles.empty}>
          <AppIcon name="check-circle" size={32} color={colors.gray400} />
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptySub}>
            {isOnline
              ? 'No pending requests right now. Guests can book while you are online.'
              : 'Go online in your profile to appear in guest search.'}
          </Text>
          {!isOnline && (
            <PrimaryButton title="Go online" onPress={() => toggleOnline(true)} />
          )}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  title: { fontSize: 22, fontWeight: '700', flex: 1, lineHeight: 28 },
  hubLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hubLinkText: { fontSize: 13, fontWeight: '600' },
  onlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  onlineBarLive: { backgroundColor: colors.greenBg, borderColor: colors.green },
  onlineBarOff: { backgroundColor: colors.gray50, borderColor: colors.gray200 },
  onlineLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gray400 },
  onlineDotLive: { backgroundColor: colors.green },
  onlineTitle: { fontSize: 14, fontWeight: '700' },
  onlineSub: { fontSize: 12, color: colors.gray600, lineHeight: 17, marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  statChip: {
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  statNum: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 11, color: colors.gray500, fontWeight: '600' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  listingMeta: { fontSize: 14, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 20 },
  section: { marginBottom: spacing.lg },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.black,
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
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySub: { fontSize: 14, color: colors.gray500, marginTop: spacing.sm, lineHeight: 20, textAlign: 'center' },
})
