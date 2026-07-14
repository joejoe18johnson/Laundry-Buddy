import type { ReactNode } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, PrimaryButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { getHostProfileDetails } from '../../data/mockData'
import { formatHostPrice } from '../../lib/hostFilters'
import { formatServicePrice } from '../../lib/hostPricing'
import { formatDropOffAvailability } from '../../lib/dropOffAvailability'
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
      <Text style={styles.statLabel}>{label}</Text>
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
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  )
}

export function HostProfileScreen() {
  const { selectedHost, navigate, selectHost, getSettingsForHost } = useApp()

  if (!selectedHost) return null

  const host = selectedHost
  const profile = getHostProfileDetails(host.id)
  const settings = getSettingsForHost(host.hostUserId)
  const paymentMethods = [
    settings.acceptCash ? 'Cash' : null,
    settings.acceptBankTransfer && settings.bankDetails.accountNumber.trim()
      ? 'Bank transfer'
      : null,
  ].filter(Boolean)
  const gradient = coverColors[host.id] ?? ['#667eea', '#764ba2']

  return (
    <View style={styles.wrapper}>
      <Screen style={styles.scroll}>
        <BackButton onPress={() => navigate('customer-home')} label="Explore" />

        <LinearGradient colors={gradient} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{host.name[0]}</Text>
          </View>
          <Text style={styles.heroName}>{host.name}</Text>
          <View style={[styles.onlineBadge, !settings.isOnline && styles.offlineBadge]}>
            <View style={[styles.onlineDot, !settings.isOnline && styles.offlineDot]} />
            <Text style={[styles.onlineText, !settings.isOnline && styles.offlineText]}>
              {settings.isOnline ? 'Online now' : 'Offline'}
            </Text>
          </View>
          <View style={styles.heroLocation}>
            <AppIcon name="map-pin" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.heroLocationText}>{host.location}{host.district ? ` · ${host.district}` : ''}</Text>
          </View>
          <View style={styles.heroRating}>
            <Stars rating={host.rating || 5} size={16} filledColor={colors.white} emptyColor="rgba(255,255,255,0.35)" />
            <Text style={styles.heroRatingText}>
              {host.rating > 0 ? host.rating.toFixed(1) : 'New'}
              {host.reviewCount ? ` · ${host.reviewCount} reviews` : ''}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <Stat icon="package" label="Loads hosted" value={String(profile.loadsHosted)} />
          <View style={styles.statDivider} />
          <Stat icon="clock" label="Response" value={profile.responseTime} />
          <View style={styles.statDivider} />
          <Stat icon="calendar" label="Member since" value={profile.memberSince} />
        </View>

        <InfoSection title="About" icon="info">
          <Text style={styles.bodyText}>
            {settings.listing.bio.trim() || profile.bio}
          </Text>
        </InfoSection>

        <View style={styles.detailsGrid}>
          <View style={styles.detailChip}>
            <AppIcon name="wind" size={16} />
            <Text style={styles.detailText}>Drying — {formatHostPrice(host.price)} per load</Text>
          </View>
          {(host.foldingPrice ?? 0) > 0 && (
            <View style={styles.detailChip}>
              <AppIcon name="layers" size={16} />
              <Text style={styles.detailText}>Folding — {formatHostPrice(host.foldingPrice!)} per load</Text>
            </View>
          )}
          <View style={styles.detailChip}>
            <AppIcon name="tag" size={16} />
            <Text style={styles.detailText}>
              Dryer sheets — {formatServicePrice(host.sheetsPrice ?? 1)} if guest buys
            </Text>
          </View>
          <View style={styles.detailChip}>
            <AppIcon name="clock" size={16} />
            <Text style={styles.detailText}>~{host.turnaroundHours} hr to dry</Text>
          </View>
          <View style={styles.detailChip}>
            <AppIcon name="calendar" size={16} />
            <Text style={styles.detailText}>
              Drop-off hours: {formatDropOffAvailability(settings.dropOffAvailability)}
            </Text>
          </View>
          {host.hasGenerator && (
            <View style={styles.detailChip}>
              <AppIcon name="zap" size={16} />
              <Text style={styles.detailText}>Generator backup</Text>
            </View>
          )}
          {paymentMethods.length > 0 && (
            <View style={styles.detailChip}>
              <AppIcon name="credit-card" size={16} />
              <Text style={styles.detailText}>Accepts {paymentMethods.join(' · ')}</Text>
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

        <InfoSection title="House rules" icon="list">
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
              Reviews{profile.reviews.length ? ` (${profile.reviews.length})` : ''}
            </Text>
          </View>
          {profile.reviews.length === 0 ? (
            <Text style={styles.emptyReviews}>No reviews yet — be the first to book.</Text>
          ) : (
            profile.reviews.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </View>

        <View style={{ height: 100 }} />
      </Screen>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={[styles.footerPrice, host.price <= 0 && styles.footerPriceFree]}>
            {formatHostPrice(host.price)}
          </Text>
          <Text style={styles.footerSub}>
            per standard load · {host.slotsLeft} slots · ~{host.turnaroundHours} hr dry
          </Text>
        </View>
        <PrimaryButton title="Book slot" icon="calendar" onPress={() => selectHost(host)} />
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingTop: spacing.sm },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
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
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.black },
  statLabel: { fontSize: 11, color: colors.gray500, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: colors.gray100 },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.black },
  bodyText: { fontSize: 15, color: colors.gray600, lineHeight: 24 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  detailText: { fontSize: 13, fontWeight: '500', color: colors.gray600 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
  bullet: { fontSize: 16, color: colors.gray400, lineHeight: 20 },
  listText: { flex: 1, fontSize: 15, color: colors.gray600, lineHeight: 22 },
  reviewCard: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  footerInfo: { flex: 1 },
  footerPrice: { fontSize: 18, fontWeight: '700' },
  footerPriceFree: { color: colors.green },
  footerSub: { fontSize: 12, color: colors.gray500, marginTop: 2 },
})
