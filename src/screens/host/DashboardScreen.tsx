import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { sheetsOptionLabel } from '../../types'
import { LoadListBreakdown } from '../../components/LoadListBreakdown'
import { formatDropOffAvailability, formatDropOffHour, type DropOffHour } from '../../lib/dropOffAvailability'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { getHostByUserId } from '../../data/mockData'
import { applyHostSettings } from '../../lib/hostListing'
import { formatHostPrice } from '../../lib/hostFilters'
import { formatMoney, getBookingAmount } from '../../lib/bookingPayments'
import { BrandSwitch, GhostButton, PrimaryButton, Screen, StatusBadge } from '../../components/ui'
import { colors, radius, spacing } from '../../theme'
import type { BookingStage } from '../../types'

function stageBadge(stage: BookingStage) {
  switch (stage) {
    case 'ready':
      return { label: 'Ready', variant: 'ready' as const }
    case 'drying':
      return { label: 'Drying', variant: 'drying' as const }
    case 'waiting':
      return { label: 'Waiting', variant: 'awaiting' as const }
    default:
      return { label: 'Received', variant: 'neutral' as const }
  }
}

function DropOffBadge({ dropOffTime }: { dropOffTime: DropOffHour }) {
  return (
    <View style={styles.dropOffBadge}>
      <AppIcon name="clock" size={12} color={colors.white} />
      <Text style={styles.dropOffBadgeText}>{formatDropOffHour(dropOffTime)}</Text>
    </View>
  )
}

function OrderDetails({
  dropOffTime,
  notes,
  paymentMethod,
  totalAmount,
  loadPhotoUri,
}: {
  dropOffTime: DropOffHour
  notes?: string
  paymentMethod?: 'cash' | 'bank_transfer'
  totalAmount?: number
  loadPhotoUri?: string
}) {
  const trimmedNotes = notes?.trim()

  return (
    <View style={styles.orderDetails}>
      {loadPhotoUri ? (
        <View style={styles.photoBlock}>
          <View style={styles.notesHeader}>
            <AppIcon name="camera" size={14} color={colors.gray600} />
            <Text style={styles.notesLabel}>Guest load photo</Text>
          </View>
          <Image source={{ uri: loadPhotoUri }} style={styles.loadPhoto} resizeMode="cover" />
        </View>
      ) : null}
      <View style={styles.detailRow}>
        <View style={styles.detailIcon}>
          <AppIcon name="clock" size={16} color={colors.black} />
        </View>
        <View style={styles.detailBody}>
          <Text style={styles.detailLabel}>Guest drop-off time</Text>
          <Text style={styles.detailValue}>{formatDropOffHour(dropOffTime)}</Text>
          <Text style={styles.detailHint}>Expect laundry during this window</Text>
        </View>
      </View>
      {trimmedNotes ? (
        <View style={styles.notesBox}>
          <View style={styles.notesHeader}>
            <AppIcon name="message-square" size={14} color={colors.gray600} />
            <Text style={styles.notesLabel}>Guest notes</Text>
          </View>
          <Text style={styles.notesText}>{trimmedNotes}</Text>
        </View>
      ) : (
        <Text style={styles.noNotes}>No special instructions from guest</Text>
      )}
      {paymentMethod && (
        <Text style={styles.paymentMeta}>
          {paymentMethod === 'cash' ? 'Cash on pickup' : 'Bank transfer after acceptance'}
          {totalAmount != null && totalAmount > 0 ? ` · ${formatMoney(totalAmount)}` : ''}
        </Text>
      )}
    </View>
  )
}

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
    confirmTransferPayment,
  } = useApp()

  const rawHost = user ? getHostByUserId(user.id) : undefined
  const hostProfile = rawHost && hostSettings
    ? applyHostSettings(rawHost, hostSettings)
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
          <AppIcon name="settings" size={16} />
          <Text style={styles.hubLinkText}>Host settings</Text>
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
        <BrandSwitch accent="green" value={isOnline} onValueChange={toggleOnline} />
      </View>

      {hostSettings && (
        <View style={styles.availabilityBar}>
          <View style={styles.availabilityHeader}>
            <AppIcon name="calendar" size={14} color={colors.gray600} />
            <Text style={styles.availabilityTitle}>Your drop-off hours (8am – 8pm)</Text>
          </View>
          <Text style={styles.availabilityValue}>
            {formatDropOffAvailability(hostSettings.dropOffAvailability)}
          </Text>
          <Pressable style={styles.availabilityEdit} onPress={() => navigate('account')}>
            <Text style={styles.availabilityEditText}>Edit availability</Text>
            <AppIcon name="chevron-right" size={14} color={colors.gray500} />
          </Pressable>
        </View>
      )}

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

      {hostRequests.length > 0 && (
        <View style={styles.sectionHeader}>
          <AppIcon name="inbox" size={14} color={colors.black} />
          <Text style={styles.sectionHeaderText}>
            New orders ({hostRequests.length})
          </Text>
        </View>
      )}

      {hostRequests.map((request) => (
        <View key={request.id} style={styles.section}>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <AppIcon name="user" size={18} color={colors.gray600} />
              </View>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{request.customerName}</Text>
                <Text style={styles.cardMeta}>
                  {request.location} · {request.loads} load{request.loads > 1 ? 's' : ''}
                </Text>
              </View>
              <DropOffBadge dropOffTime={request.dropOffTime} />
            </View>
            {request.clothesList && request.clothesList.length > 0 ? (
              <LoadListBreakdown items={request.clothesList} title="Guest's load list" />
            ) : null}
            <OrderDetails
              dropOffTime={request.dropOffTime}
              notes={request.notes}
              paymentMethod={request.paymentMethod}
              totalAmount={request.totalAmount}
              loadPhotoUri={request.loadPhotoUri}
            />
            <View style={styles.tags}>
              <Text style={styles.tag}>{sheetsOptionLabel(request.sheetsOption, hostProfile?.sheetsPrice ?? 1)}</Text>
              {request.foldingService && <Text style={styles.tag}>Folding requested</Text>}
            </View>
            <View style={styles.actions}>
              <View style={styles.actionBtn}>
                <PrimaryButton title="Accept" onPress={() => acceptRequest(request.id)} full />
              </View>
              <View style={styles.actionBtn}>
                <GhostButton title="Decline" onPress={() => declineRequest(request.id)} full />
              </View>
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
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{load.customerName}</Text>
                <Text style={styles.cardMeta}>
                  {load.loads} load · {load.paymentMethod === 'cash' ? 'Cash' : 'Transfer'}
                  {load.paymentMethod === 'bank_transfer' && load.paymentStatus === 'pending'
                    ? ' · Awaiting proof'
                    : ''}
                </Text>
              </View>
              <StatusBadge {...stageBadge(load.stage)} />
              <DropOffBadge dropOffTime={load.dropOffTime} />
            </View>
            {load.clothesList && load.clothesList.length > 0 ? (
              <LoadListBreakdown items={load.clothesList} title="Guest's load list" />
            ) : null}
            <OrderDetails
              dropOffTime={load.dropOffTime}
              notes={load.notes}
              paymentMethod={load.paymentMethod}
              totalAmount={load.totalAmount}
              loadPhotoUri={load.loadPhotoUri}
            />
            {load.paymentMethod === 'bank_transfer' && load.paymentStatus === 'pending' && (
              <>
                <Text style={styles.transferHint}>
                  Guest should send transfer proof on WhatsApp. Confirm once verified.
                </Text>
                <GhostButton
                  title={`Confirm ${formatMoney(getBookingAmount(load))} received`}
                  icon="check-circle"
                  full
                  onPress={() => confirmTransferPayment(load.id)}
                />
              </>
            )}
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
  availabilityBar: {
    backgroundColor: colors.gray50,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    gap: spacing.sm,
  },
  availabilityHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  availabilityTitle: { fontSize: 12, fontWeight: '700', color: colors.gray600, textTransform: 'capitalize' },
  availabilityValue: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  availabilityEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginTop: spacing.sm,
  },
  availabilityEditText: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionHeaderText: { fontSize: 16, fontWeight: '700' },
  section: { marginBottom: spacing.lg },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray500,
    textTransform: 'capitalize',
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
  cardHeader: { flex: 1 },
  cardMeta: { fontSize: 14, color: colors.gray500, marginTop: 2, lineHeight: 20 },
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
    textTransform: 'capitalize',
    letterSpacing: 0.4,
  },
  detailValue: { fontSize: 16, fontWeight: '700', marginTop: 2, lineHeight: 22 },
  detailHint: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  dropOffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.black,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    maxWidth: 120,
  },
  dropOffBadgeText: { fontSize: 11, fontWeight: '700', color: colors.white, flexShrink: 1 },
  notesBox: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
    gap: 4,
  },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notesLabel: { fontSize: 11, fontWeight: '700', color: colors.gray600, textTransform: 'capitalize' },
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
  actionBtn: { flex: 1 },
  done: { color: colors.green, fontWeight: '600', fontSize: 15, lineHeight: 22 },
  transferHint: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySub: { fontSize: 14, color: colors.gray500, marginTop: spacing.sm, lineHeight: 20, textAlign: 'center' },
})
