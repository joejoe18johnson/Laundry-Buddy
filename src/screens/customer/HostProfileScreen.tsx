import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon } from '../../components/AppIcon'
import { TopRatedHostBadge } from '../../components/TopRatedHostBadge'
import { priceFooterShellStyle, SimpleBookFooterBar } from '../../components/PriceFooterBar'
import { BackButton, PrimaryButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { getHostProfileDetails } from '../../data/mockData'
import { summarizeRatings } from '../../lib/reviewStorage'
import { formatHostDisplayName } from '../../lib/displayName'
import { formatHostPrice, hostPriceLabel } from '../../lib/hostFilters'
import { isTopRatedHost } from '../../lib/hostReputation'
import { formatDryTimeStat, formatDryTimeInline } from '../../lib/turnaroundTime'
import { bottomSafePadding } from '../../lib/safeAreaInsets'
import { formatDryerSheetsRate, formatServicePrice, getHostPricing } from '../../lib/hostPricing'
import { formatDropOffAvailability } from '../../lib/dropOffAvailability'
import { PAYMENT_METHOD_LABELS } from '../../lib/hostSettingsStorage'
import { canBookOrHost } from '../../lib/identityVerification'
import { toTitleCase } from '../../lib/titleCase'
import { coverColors, radius, spacing } from '../../theme'
import type { HostReview } from '../../types'

function createHostProfileStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.white },
    scroll: { paddingTop: spacing.sm },
    hero: {
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.95)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    avatarText: { fontSize: 28, fontWeight: '700', color: colors.black },
    heroName: { fontSize: 26, fontWeight: '700', color: colors.white, letterSpacing: -0.5 },
    topRatedWrap: { marginTop: spacing.sm },
    onlineBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'center',
      marginTop: spacing.sm,
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: radius.pill,
    },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7CFC7C' },
    onlineText: { fontSize: 12, fontWeight: '700', color: colors.white },
    offlineBadge: { backgroundColor: 'rgba(255,255,255,0.15)' },
    offlineDot: { backgroundColor: colors.gray400 },
    offlineText: { color: 'rgba(255,255,255,0.75)' },
    heroLocation: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
    heroLocationText: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
    heroRating: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
    heroRatingText: { fontSize: 14, fontWeight: '600', color: colors.white },
    heroMessageBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      alignSelf: 'stretch',
      marginTop: spacing.lg,
      paddingVertical: 12,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.85)',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    heroMessageBtnPressed: { backgroundColor: 'rgba(255,255,255,0.22)' },
    heroMessageBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
    stars: { flexDirection: 'row', gap: 2 },
    statsRow: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      paddingVertical: spacing.lg,
      marginBottom: spacing.xl,
    },
    stat: { flex: 1, alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm },
    statValue: { fontSize: 15, fontWeight: '700', color: colors.black },
    statLabel: { fontSize: 11, color: colors.gray500, textAlign: 'center', fontWeight: '600' },
    statDivider: { width: 1, backgroundColor: colors.gray100 },
    section: { marginBottom: spacing.xl },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.black },
    bodyText: { fontSize: 15, color: colors.gray600, lineHeight: 24, marginBottom: spacing.sm },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
    detailChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.gray50,
      borderWidth: 1,
      borderColor: colors.gray100,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
    },
    detailText: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
    listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.md },
    bullet: { fontSize: 16, color: colors.gray400, lineHeight: 20 },
    listText: { flex: 1, fontSize: 15, color: colors.gray600, lineHeight: 22 },
    reviewCard: {
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      backgroundColor: colors.white,
    },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    reviewAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.gray100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reviewInitial: { fontSize: 14, fontWeight: '700', color: colors.gray600 },
    reviewMeta: { flex: 1 },
    reviewAuthor: { fontSize: 14, fontWeight: '600', color: colors.black },
    reviewDate: { fontSize: 12, color: colors.gray400, marginTop: 2 },
    reviewComment: { fontSize: 14, color: colors.gray600, lineHeight: 22 },
    emptyReviews: { fontSize: 14, color: colors.gray500, fontStyle: 'italic', lineHeight: 22 },
    footerShell: priceFooterShellStyle(colors),
    footerBrowseNote: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.gray500,
      textAlign: 'center',
      paddingHorizontal: spacing.screen,
      paddingBottom: spacing.sm,
      lineHeight: 17,
    },
  })
}

function Stars({
  rating,
  size = 14,
  filledColor,
  emptyColor,
  styles,
  colors,
}: {
  rating: number
  size?: number
  filledColor?: string
  emptyColor?: string
  styles: ReturnType<typeof createHostProfileStyles>
  colors: ReturnType<typeof useTheme>['colors']
}) {
  const filled = filledColor ?? colors.black
  const empty = emptyColor ?? colors.gray200
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <AppIcon
          key={n}
          name="star"
          size={size}
          color={n <= Math.round(rating) ? filled : empty}
        />
      ))}
    </View>
  )
}

function Stat({
  icon,
  label,
  value,
  styles,
  colors,
}: {
  icon: 'package' | 'wind' | 'calendar'
  label: string
  value: string
  styles: ReturnType<typeof createHostProfileStyles>
  colors: ReturnType<typeof useTheme>['colors']
}) {
  return (
    <View style={styles.stat}>
      <AppIcon name={icon} size={18} color={colors.gray500} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{toTitleCase(label)}</Text>
    </View>
  )
}

function ReviewCard({
  review,
  styles,
  colors,
}: {
  review: HostReview
  styles: ReturnType<typeof createHostProfileStyles>
  colors: ReturnType<typeof useTheme>['colors']
}) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewInitial}>{review.author[0]}</Text>
        </View>
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewAuthor}>{review.author}</Text>
          <Text style={styles.reviewDate}>{review.date}</Text>
        </View>
        <Stars rating={review.rating} size={12} styles={styles} colors={colors} />
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  )
}

function InfoSection({
  title,
  icon,
  children,
  styles,
}: {
  title: string
  icon: 'info' | 'image' | 'list'
  children: ReactNode
  styles: ReturnType<typeof createHostProfileStyles>
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppIcon name={icon} size={18} />
        <Text style={styles.sectionTitle}>{toTitleCase(title)}</Text>
      </View>
      {children}
    </View>
  )
}

export function HostProfileScreen() {
  const { selectedHost, navigate, selectHost, openHostInquiryChat, getSettingsForHost, getReviewsForHost, refreshHostReviews, activeGuestBookings } =
    useApp()
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createHostProfileStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const footerBottomPad = bottomSafePadding(insets.bottom)

  useEffect(() => {
    if (!selectedHost) return
    void refreshHostReviews(selectedHost.id)
  }, [selectedHost?.id, refreshHostReviews])

  if (!selectedHost) return null

  const host = selectedHost
  const displayName = formatHostDisplayName(host.name)
  const profile = getHostProfileDetails(host.id)
  const settings = getSettingsForHost(host.hostUserId)
  const pricing = getHostPricing(host, settings)
  const reviews = getReviewsForHost(host.id)
  const ratingSummary = summarizeRatings(reviews)
  const topRated = isTopRatedHost(host, reviews)
  const isHostViewer = user?.role === 'host'
  const browseOnly = isHostViewer
  const paymentMethods = [
    settings.acceptCash ? PAYMENT_METHOD_LABELS.cash : null,
    settings.acceptBankTransfer && settings.bankDetails.accountNumber.trim()
      ? 'Bank transfer'
      : null,
  ].filter(Boolean)
  const gradient = coverColors[host.id] ?? ['#667eea', '#764ba2']
  const verified = user ? canBookOrHost(user) : false
  const activeLoadCount = activeGuestBookings.length
  const foldingPrice = pricing.foldingPrice

  return (
    <View style={styles.wrapper}>
      <Screen style={styles.scroll}>
        <BackButton
          onPress={() => navigate('customer-home')}
          label={isHostViewer ? 'Browse Hosts' : 'Explore Dryers'}
        />

        <LinearGradient colors={gradient} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName[0]}</Text>
          </View>
          <Text style={styles.heroName}>{displayName}</Text>
          {topRated ? (
            <View style={styles.topRatedWrap}>
              <TopRatedHostBadge light />
            </View>
          ) : null}
          <View style={[styles.onlineBadge, !settings.isOnline && styles.offlineBadge]}>
            <View style={[styles.onlineDot, !settings.isOnline && styles.offlineDot]} />
            <Text style={[styles.onlineText, !settings.isOnline && styles.offlineText]}>
              {settings.isOnline ? toTitleCase('Online Now') : toTitleCase('Offline')}
            </Text>
          </View>
          <View style={styles.heroLocation}>
            <AppIcon name="map-pin" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.heroLocationText}>{host.location}{host.district ? ` · ${host.district}` : ''}</Text>
          </View>
          <View style={styles.heroRating}>
            <Stars
              rating={ratingSummary.rating || host.rating || 5}
              size={16}
              filledColor={colors.white}
              emptyColor="rgba(255,255,255,0.35)"
              styles={styles}
              colors={colors}
            />
            <Text style={styles.heroRatingText}>
              {(ratingSummary.rating || host.rating) > 0
                ? (ratingSummary.rating || host.rating).toFixed(1)
                : 'New'}
              {ratingSummary.reviewCount || host.reviewCount
                ? ` · ${ratingSummary.reviewCount || host.reviewCount} reviews`
                : ''}
            </Text>
          </View>
          {!browseOnly ? (
            <Pressable
              style={({ pressed }) => [styles.heroMessageBtn, pressed && styles.heroMessageBtnPressed]}
              onPress={() => openHostInquiryChat(host)}
            >
              <AppIcon name="message-circle" size={16} color="#fff" />
              <Text style={styles.heroMessageBtnText}>{toTitleCase('Message host')}</Text>
            </Pressable>
          ) : null}
        </LinearGradient>

        <View style={styles.statsRow}>
          <Stat icon="package" label="Loads Hosted" value={String(profile.loadsHosted)} styles={styles} colors={colors} />
          <View style={styles.statDivider} />
          <Stat
            icon="wind"
            label="Dry Time"
            value={formatDryTimeStat(host.turnaroundHours)}
            styles={styles}
            colors={colors}
          />
          <View style={styles.statDivider} />
          <Stat icon="calendar" label="Member Since" value={profile.memberSince} styles={styles} colors={colors} />
        </View>

        <InfoSection title="About" icon="info" styles={styles}>
          <Text style={styles.bodyText}>
            {settings.listing.bio.trim() || profile.bio}
          </Text>
        </InfoSection>

        <View style={styles.detailsGrid}>
          <View style={styles.detailChip}>
            <AppIcon name="wind" size={16} />
            <Text style={styles.detailText}>{toTitleCase('Drying')} — {formatServicePrice(pricing.dryPrice)} {toTitleCase('Per Load')}</Text>
          </View>
          {foldingPrice > 0 && (
            <View style={styles.detailChip}>
              <AppIcon name="layers" size={16} />
              <Text style={styles.detailText}>{toTitleCase('Folding')} — {formatServicePrice(foldingPrice)} {toTitleCase('Per Load')}</Text>
            </View>
          )}
          <View style={styles.detailChip}>
            <AppIcon name="tag" size={16} />
            <Text style={styles.detailText}>
              {toTitleCase('Dryer Sheets')} — {formatDryerSheetsRate(pricing.sheetsPrice)} {toTitleCase('If Guest Buys')}
            </Text>
          </View>
          <View style={styles.detailChip}>
            <AppIcon name="wind" size={16} />
            <Text style={styles.detailText}>{formatDryTimeInline(host.turnaroundHours)}</Text>
          </View>
          <View style={styles.detailChip}>
            <AppIcon name="calendar" size={16} />
            <Text style={styles.detailText}>
              Drop-Off Hours: {formatDropOffAvailability(settings.dropOffAvailability)}
            </Text>
          </View>
          {host.hasGenerator && (
            <View style={styles.detailChip}>
              <AppIcon name="zap" size={16} />
              <Text style={styles.detailText}>{toTitleCase('Generator Backup')}</Text>
            </View>
          )}
          {paymentMethods.length > 0 && (
            <View style={styles.detailChip}>
              <AppIcon name="credit-card" size={16} />
              <Text style={styles.detailText}>{toTitleCase('Accepts')} {paymentMethods.join(' · ')}</Text>
            </View>
          )}
        </View>

        <InfoSection title="House Rules" icon="list" styles={styles}>
          {(host.rules.length > 0 ? host.rules : [toTitleCase('No house rules listed yet.')]).map((rule) => (
            <View key={rule} style={styles.listItem}>
              <Text style={styles.bullet}>·</Text>
              <Text style={styles.listText}>{rule}</Text>
            </View>
          ))}
        </InfoSection>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppIcon name="message-circle" size={18} />
            <Text style={styles.sectionTitle}>
              {toTitleCase('Reviews')}{reviews.length ? ` (${reviews.length})` : ''}
            </Text>
          </View>
          {reviews.length === 0 ? (
            <Text style={styles.emptyReviews}>
              {toTitleCase(
                browseOnly ? 'No Reviews Yet.' : 'No Reviews Yet — Be The First To Book.',
              )}
            </Text>
          ) : (
            reviews.map((review) => <ReviewCard key={review.id} review={review} styles={styles} colors={colors} />)
          )}
        </View>

        <View style={{ height: 120 }} />
      </Screen>

      <View style={[styles.footerShell, { paddingBottom: footerBottomPad }]}>
        {!browseOnly ? (
          <SimpleBookFooterBar
            price={formatHostPrice(pricing.dryPrice)}
            isFree={pricing.dryPrice <= 0}
            unit={toTitleCase(hostPriceLabel(pricing.dryPrice))}
            action={
              <PrimaryButton
                title={
                  !verified
                    ? 'Verify to book'
                    : !settings.isOnline
                      ? 'Host Offline'
                      : activeLoadCount > 0
                        ? 'Book Another Load'
                        : 'Book now'
                }
                compact
                disabled={!settings.isOnline && verified}
                onPress={() => selectHost(host)}
              />
            }
          />
        ) : (
          <SimpleBookFooterBar
            price={formatHostPrice(pricing.dryPrice)}
            isFree={pricing.dryPrice <= 0}
            unit={toTitleCase(hostPriceLabel(pricing.dryPrice))}
            action={<PrimaryButton title="Browse only" compact disabled onPress={() => {}} />}
          />
        )}
        {browseOnly ? (
          <Text style={styles.footerBrowseNote}>
            {toTitleCase('Browse only — hosts can compare prices but cannot book or message each other.')}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
