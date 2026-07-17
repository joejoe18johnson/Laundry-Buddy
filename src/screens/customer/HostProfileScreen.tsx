import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, PrimaryButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { getHostProfileDetails } from '../../data/mockData'
import { summarizeRatings } from '../../lib/reviewStorage'
import { formatHostFooterMeta, formatHostPrice } from '../../lib/hostFilters'
import { formatTurnaroundHours } from '../../lib/turnaroundTime'
import { bottomSafePadding } from '../../lib/safeAreaInsets'
import { formatServicePrice } from '../../lib/hostPricing'
import { formatDropOffAvailability } from '../../lib/dropOffAvailability'
import { toTitleCase } from '../../lib/titleCase'
import { colors, coverColors, radius, spacing } from '../../theme'
import type { HostReview } from '../../types'

function Stars({
  rating,
  size = 14,
  filledColor = colors.black,
  emptyColor = colors.gray200,
}: {
  rating: number
  size?: number
  filledColor?: string
  emptyColor?: string
}) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <AppIcon
          key={n}
          name="star"
          size={size}
          color={n <= Math.round(rating) ? filledColor : emptyColor}
        />
      ))}
    </View>
  )
}

function Stat({ icon, label, value }: { icon: 'package' | 'clock' | 'calendar'; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppIcon name={icon} size={18} color={colors.gray500} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{toTitleCase(label)}</Text>
    </View>
  )
}

function ReviewCard({ review }: { review: HostReview }) {
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
        <Stars rating={review.rating} size={12} />
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  )
}

function InfoSection({ title, icon, children }: { title: string; icon: 'info' | 'image' | 'list'; children: ReactNode }) {
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
  const { selectedHost, navigate, selectHost, getSettingsForHost, getReviewsForHost, refreshHostReviews, booking } =
    useApp()
  const insets = useSafeAreaInsets()
  const footerBottomPad = bottomSafePadding(insets.bottom)

  useEffect(() => {
    if (!selectedHost) return
    void refreshHostReviews(selectedHost.id)
  }, [selectedHost?.id, refreshHostReviews])

  if (!selectedHost) return null

  const host = selectedHost
  const profile = getHostProfileDetails(host.id)
  const settings = getSettingsForHost(host.hostUserId)
  const reviews = getReviewsForHost(host.id)
  const ratingSummary = summarizeRatings(reviews)
  const paymentMethods = [
    settings.acceptCash ? 'Cash' : null,
    settings.acceptBankTransfer && settings.bankDetails.accountNumber.trim()
      ? 'Bank transfer'
      : null,
  ].filter(Boolean)
  const gradient = coverColors[host.id] ?? ['#667eea', '#764ba2']
  const canBook = settings.isOnline && !booking

  return (
    <View style={styles.wrapper}>
      <Screen style={styles.scroll}>
        <BackButton onPress={() => navigate('customer-home')} label="Explore Dryers" />

        <LinearGradient colors={gradient} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{host.name[0]}</Text>
          </View>
          <Text style={styles.heroName}>{host.name}</Text>
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
        </LinearGradient>

        <View style={styles.statsRow}>
          <Stat icon="package" label="Loads Hosted" value={String(profile.loadsHosted)} />
          <View style={styles.statDivider} />
          <Stat icon="clock" label="Response Time" value={profile.responseTime} />
          <View style={styles.statDivider} />
          <Stat icon="calendar" label="Member Since" value={profile.memberSince} />
        </View>

        <InfoSection title="About" icon="info">
          <Text style={styles.bodyText}>
            {settings.listing.bio.trim() || profile.bio}
          </Text>
        </InfoSection>

        <View style={styles.detailsGrid}>
          <View style={styles.detailChip}>
            <AppIcon name="wind" size={16} />
            <Text style={styles.detailText}>{toTitleCase('Drying')} — {formatHostPrice(host.price)} {toTitleCase('Per Load')}</Text>
          </View>
          {(host.foldingPrice ?? 0) > 0 && (
            <View style={styles.detailChip}>
              <AppIcon name="layers" size={16} />
              <Text style={styles.detailText}>{toTitleCase('Folding')} — {formatHostPrice(host.foldingPrice!)} {toTitleCase('Per Load')}</Text>
            </View>
          )}
          <View style={styles.detailChip}>
            <AppIcon name="tag" size={16} />
            <Text style={styles.detailText}>
              {toTitleCase('Dryer Sheets')} — {formatServicePrice(host.sheetsPrice ?? 1)} {toTitleCase('If Guest Buys')}
            </Text>
          </View>
          <View style={styles.detailChip}>
            <AppIcon name="clock" size={16} />
            <Text style={styles.detailText}>{formatTurnaroundHours(host.turnaroundHours)} to dry</Text>
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

        <InfoSection title="Setup" icon="image">
          {host.photos.map((photo) => (
            <View key={photo} style={styles.listItem}>
              <AppIcon name="check" size={14} color={colors.green} />
              <Text style={styles.listText}>{photo}</Text>
            </View>
          ))}
        </InfoSection>

        <InfoSection title="House Rules" icon="list">
          {host.rules.map((rule) => (
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
            <Text style={styles.emptyReviews}>{toTitleCase('No Reviews Yet — Be The First To Book.')}</Text>
          ) : (
            reviews.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </View>

        <View style={{ height: 160 }} />
      </Screen>

      <View style={[styles.footerShell, { paddingBottom: footerBottomPad }]}>
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerSummary} numberOfLines={2}>
              <Text style={[styles.footerPrice, host.price <= 0 && styles.footerPriceFree]}>
                {formatHostPrice(host.price)}
              </Text>
              <Text style={styles.footerMetaInline}>
                {' · '}
                {formatHostFooterMeta(host.slotsLeft, host.turnaroundHours)}
              </Text>
            </Text>
          </View>
          <View style={styles.footerAction}>
            <PrimaryButton
              title={canBook ? 'Book Slot' : booking ? 'Finish Current Load' : 'Host Offline'}
              icon="calendar"
              disabled={!canBook}
              onPress={() => (canBook ? selectHost(host) : navigate('customer-tracking'))}
            />
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
  footerShell: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  footerInfo: { flex: 1, minWidth: 0, justifyContent: 'center' },
  footerSummary: { lineHeight: 22 },
  footerPrice: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.black,
  },
  footerPriceFree: { color: colors.green },
  footerMetaInline: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray500,
  },
  footerAction: { flexShrink: 0, alignSelf: 'center' },
})
