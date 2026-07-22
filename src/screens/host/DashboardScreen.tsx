import { useMemo, useState, useEffect } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { sheetsOptionLabel } from '../../types'
import { LoadListBreakdown } from '../../components/LoadListBreakdown'
import { formatDropOffAvailability, formatDropOffHour, formatDropOffHoursWindow, type DropOffHour } from '../../lib/dropOffAvailability'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { getHostByUserId } from '../../data/mockData'
import { applyHostSettings } from '../../lib/hostListing'
import { HostPricingSection } from '../../components/host/HostPricingSection'
import { normalizeHostSettings } from '../../lib/hostSettingsStorage'
import { formatDryTimeInline } from '../../lib/turnaroundTime'
import { formatMoney } from '../../lib/bookingPayments'
import { canBookOrHost, getIdentityVerification } from '../../lib/identityVerification'
import { countDryerTabLoads } from '../../lib/hostLoads'
import { toTitleCase } from '../../lib/titleCase'
import { BrandSwitch, GhostButton, PrimaryButton, Screen } from '../../components/ui'
import { VerificationPromptBanner } from '../../components/VerificationPromptBanner'
import { useTheme } from '../../context/ThemeContext'
import { radius, spacing } from '../../theme'
import type { HostPricing } from '../../types'

function GuestCardHeader({
  name,
  metaParts,
  styles,
}: {
  name: string
  metaParts: string[]
  styles: ReturnType<typeof createDashboardStyles>
}) {
  const { colors } = useTheme()
  return (
    <View style={styles.guestHeader}>
      <View style={styles.avatar}>
        <AppIcon name="user" size={18} color={colors.gray600} />
      </View>
      <View style={styles.guestHeaderBody}>
        <Text style={styles.cardTitle}>{name}</Text>
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
  styles: ReturnType<typeof createDashboardStyles>
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
    openChat,
  } = useApp()

  const rawHost = user ? getHostByUserId(user.id) : undefined
  const hostProfile = rawHost && hostSettings
    ? applyHostSettings(rawHost, hostSettings)
    : rawHost
  const isOnline = hostSettings?.isOnline ?? false
  const [pricingDraft, setPricingDraft] = useState<HostPricing>(() =>
    normalizeHostSettings(hostSettings, rawHost).pricing,
  )
  const [pricingSaved, setPricingSaved] = useState(true)
  const verification = user ? getIdentityVerification(user) : null
  const showVerificationBanner = !!user && !canBookOrHost(user)
  const { colors } = useTheme()
  const styles = useMemo(() => createDashboardStyles(colors), [colors])

  const dryerLoadCount = useMemo(() => countDryerTabLoads(activeLoads), [activeLoads])

  useEffect(() => {
    if (!hostSettings) return
    setPricingDraft(normalizeHostSettings(hostSettings, rawHost).pricing)
    setPricingSaved(true)
  }, [hostSettings, rawHost])

  const toggleOnline = async (online: boolean) => {
    if (!hostSettings) return
    await updateHostSettings({ ...hostSettings, isOnline: online })
  }

  const patchPricing = (partial: Partial<HostPricing>) => {
    setPricingDraft((prev) => ({ ...prev, ...partial }))
    setPricingSaved(false)
  }

  const handleSavePricing = async () => {
    if (!hostSettings) return
    await updateHostSettings({ ...hostSettings, pricing: pricingDraft })
    setPricingSaved(true)
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
          <Text style={styles.hubLinkText}>{toTitleCase('Host settings')}</Text>
        </Pressable>
      </View>

      {showVerificationBanner && verification ? (
        <VerificationPromptBanner
          role="host"
          status={verification.status}
          onPress={() => navigate('identity-verification')}
        />
      ) : null}

      <View style={[styles.onlineBar, isOnline ? styles.onlineBarLive : styles.onlineBarOff]}>
        <View style={styles.onlineLeft}>
          <View style={[styles.onlineDot, isOnline && styles.onlineDotLive]} />
          <View>
            <Text style={styles.onlineTitle}>
              {isOnline ? toTitleCase('Online — visible to guests') : toTitleCase('Offline — hidden from search')}
            </Text>
            <Text style={styles.onlineSub}>
              {isOnline
                ? toTitleCase('Tap to go offline when you are done for the day')
                : toTitleCase('Go online to start receiving bookings')}
            </Text>
          </View>
        </View>
        <BrandSwitch accent="green" value={isOnline} onValueChange={toggleOnline} />
      </View>

      {hostSettings && (
        <View style={styles.availabilityBar}>
          <View style={styles.availabilityHeader}>
            <AppIcon name="calendar" size={14} color={colors.gray600} />
            <Text style={styles.availabilityTitle}>{toTitleCase('Your drop-off hours')} ({formatDropOffHoursWindow()})</Text>
          </View>
          <Text style={styles.availabilityValue}>
            {formatDropOffAvailability(hostSettings.dropOffAvailability)}
          </Text>
          <Pressable style={styles.availabilityEdit} onPress={() => navigate('account')}>
            <Text style={styles.availabilityEditText}>{toTitleCase('Edit availability')}</Text>
            <AppIcon name="chevron-right" size={14} color={colors.gray500} />
          </Pressable>
        </View>
      )}

      {hostSettings && (
        <HostPricingSection
          variant="card"
          pricing={pricingDraft}
          onPricingChange={patchPricing}
          showSaveButton
          saved={pricingSaved}
          onSave={() => void handleSavePricing()}
          onEditInSettings={() => navigate('account')}
        />
      )}

      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statNum}>{hostStats.loadsToday}</Text>
          <Text style={styles.statLabel}>{toTitleCase('loads today')}</Text>
        </View>
        <View style={[styles.pill, hostStats.accepting ? styles.pillLive : null]}>
          <AppIcon
            name={hostStats.accepting ? 'check-circle' : 'x-circle'}
            size={12}
            color={hostStats.accepting ? colors.green : colors.gray600}
          />
          <Text style={[styles.pillText, hostStats.accepting ? styles.pillLiveText : null]}>
            {hostStats.accepting ? toTitleCase('Accepting loads') : toTitleCase('Full today')}
          </Text>
        </View>
      </View>

      {hostProfile && (
        <Text style={styles.listingMeta}>
          {formatDryTimeInline(hostProfile.turnaroundHours)}
        </Text>
      )}

      {dryerLoadCount > 0 && (
        <Pressable style={styles.dryerBanner} onPress={() => navigate('host-dryer')}>
          <View style={styles.dryerBannerIcon}>
            <AppIcon name="wind" size={18} color={colors.white} />
          </View>
          <View style={styles.dryerBannerCopy}>
            <Text style={styles.dryerBannerTitle}>
              {toTitleCase(
                `${dryerLoadCount} active load${dryerLoadCount === 1 ? '' : 's'} on the Dryer tab`,
              )}
            </Text>
            <Text style={styles.dryerBannerSub}>
              {toTitleCase('Payment, drying, and pickup — manage everything there')}
            </Text>
          </View>
          <AppIcon name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
        </Pressable>
      )}

      {hostRequests.length > 0 && (
        <View style={styles.newOrdersBanner}>
          <View style={styles.newOrdersBannerIcon}>
            <AppIcon name="inbox" size={18} color={colors.white} />
          </View>
          <View style={styles.newOrdersBannerCopy}>
            <Text style={styles.newOrdersBannerTitle}>
              {toTitleCase(`${hostRequests.length} new load request${hostRequests.length === 1 ? '' : 's'}`)}
            </Text>
            <Text style={styles.newOrdersBannerSub}>
              {toTitleCase('Accept or decline below — guests are waiting for your response.')}
            </Text>
          </View>
        </View>
      )}

      {hostRequests.length > 0 && (
        <View style={styles.sectionHeader}>
          <AppIcon name="inbox" size={14} color={colors.black} />
          <Text style={styles.sectionHeaderText}>
            {toTitleCase(`New orders (${hostRequests.length})`)}
          </Text>
        </View>
      )}

      {hostRequests.map((request) => (
        <View key={request.id} style={styles.section}>
          <View style={[styles.card, styles.requestCard]}>
            <GuestCardHeader
              name={request.customerName}
              metaParts={[
                request.location,
                `${request.loads} load${request.loads > 1 ? 's' : ''}`,
                formatDropOffHour(request.dropOffTime),
                request.paymentMethod === 'cash' ? 'Cash · Drop-off' : 'Transfer',
              ]}
              styles={styles}
            />
            {request.clothesList && request.clothesList.length > 0 ? (
              <LoadListBreakdown items={request.clothesList} title="Guest's load list" />
            ) : null}
            <OrderDetails
              dropOffTime={request.dropOffTime}
              notes={request.notes}
              paymentMethod={request.paymentMethod}
              totalAmount={request.totalAmount}
              loadPhotoUri={request.loadPhotoUri}
              styles={styles}
            />
            <View style={styles.tags}>
              <Text style={styles.tag}>{sheetsOptionLabel(request.sheetsOption)}</Text>
              {request.foldingService && <Text style={styles.tag}>{toTitleCase('Folding requested')}</Text>}
            </View>
            <View style={styles.actions}>
              <View style={styles.actionBtn}>
                <PrimaryButton title="Accept" onPress={() => acceptRequest(request.id)} full />
              </View>
              <View style={styles.actionBtn}>
                <GhostButton title="Decline" onPress={() => declineRequest(request.id)} full />
              </View>
            </View>
            <GhostButton
              title="Message guest"
              icon="message-circle"
              full
              onPress={() => openChat(request.id, request.id)}
            />
          </View>
        </View>
      ))}

      {hostRequests.length === 0 && dryerLoadCount === 0 && (
        <View style={styles.empty}>
          <AppIcon name="check-circle" size={32} color={colors.gray400} />
          <Text style={styles.emptyTitle}>{toTitleCase('All caught up')}</Text>
          <Text style={styles.emptySub}>
            {isOnline
              ? toTitleCase('No pending requests right now. Guests can book while you are online.')
              : toTitleCase('Go online in your profile to appear in guest search.')}
          </Text>
          {!isOnline && (
            <PrimaryButton title="Go online" onPress={() => toggleOnline(true)} />
          )}
        </View>
      )}
    </Screen>
  )
}

function createDashboardStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
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
  availabilityTitle: { fontSize: 12, fontWeight: '700', color: colors.gray600 },
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
  pillLive: { backgroundColor: colors.greenBg, borderColor: colors.green },
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
  newOrdersBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  newOrdersBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newOrdersBannerCopy: { flex: 1, gap: 4 },
  newOrdersBannerTitle: { fontSize: 16, fontWeight: '700', color: colors.white },
  newOrdersBannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 18 },
  dryerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  dryerBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dryerBannerCopy: { flex: 1, gap: 4 },
  dryerBannerTitle: { fontSize: 16, fontWeight: '700', color: colors.white },
  dryerBannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 18 },
  section: { marginBottom: spacing.lg },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray500,
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  requestCard: {
    borderWidth: 2,
    backgroundColor: colors.gray50,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
  pickupBlock: { gap: spacing.md, marginTop: spacing.sm },
  pickupHint: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  transferHint: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySub: { fontSize: 14, color: colors.gray500, marginTop: spacing.sm, lineHeight: 20, textAlign: 'center' },
  })
}
