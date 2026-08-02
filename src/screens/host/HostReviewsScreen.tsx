import { useEffect, useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { HostReviewsList } from '../../components/host/HostReviewsList'
import { BackButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { getHostByUserId } from '../../data/mockData'
import { summarizeRatings } from '../../lib/reviewStorage'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    title: { fontSize: 26, fontWeight: '700', lineHeight: 32, color: colors.black },
    subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
    summaryCard: {
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.gray50,
    },
    summaryRating: { fontSize: 36, fontWeight: '700', color: colors.black },
    summaryMeta: { fontSize: 14, color: colors.gray500, fontWeight: '500' },
    stars: { flexDirection: 'row', gap: 2 },
    empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.black },
    emptySub: {
      fontSize: 14,
      color: colors.gray500,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: spacing.lg,
    },
  })
}

function Stars({
  rating,
  colors,
  styles,
}: {
  rating: number
  colors: ReturnType<typeof useTheme>['colors']
  styles: ReturnType<typeof createStyles>
}) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <AppIcon
          key={n}
          name="star"
          size={12}
          color={n <= Math.round(rating) ? colors.accent : colors.gray200}
        />
      ))}
    </View>
  )
}

export function HostReviewsScreen() {
  const { user } = useAuth()
  const { navigate, getReviewsForHost, refreshHostReviews } = useApp()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const host = user ? getHostByUserId(user.id) : null
  const reviews = host ? getReviewsForHost(host.id) : []
  const ratingSummary = summarizeRatings(reviews)

  useEffect(() => {
    if (!host) return
    void refreshHostReviews(host.id)
  }, [host?.id, refreshHostReviews])

  if (!user || !host) return null

  return (
    <Screen>
      <BackButton onPress={() => navigate('account')} label="Host Hub" />
      <View style={styles.titleRow}>
        <AppIcon name="star" size={22} color={colors.accent} />
        <Text style={styles.title}>{toTitleCase('Your reviews')}</Text>
      </View>
      <Text style={styles.subtitle}>
        {toTitleCase('Feedback from guests who completed loads with you')}
      </Text>

      {reviews.length > 0 ? (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryRating}>
              {ratingSummary.rating > 0 ? ratingSummary.rating.toFixed(1) : 'New'}
            </Text>
            <Stars rating={ratingSummary.rating || 5} colors={colors} styles={styles} />
            <Text style={styles.summaryMeta}>
              {ratingSummary.reviewCount} review{ratingSummary.reviewCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <HostReviewsList reviews={reviews} />
        </>
      ) : (
        <View style={styles.empty}>
          <AppIcon name="star" size={32} color={colors.gray400} />
          <Text style={styles.emptyTitle}>{toTitleCase('No reviews yet')}</Text>
          <Text style={styles.emptySub}>
            {toTitleCase('When guests finish a load they can leave a review here.')}
          </Text>
        </View>
      )}
    </Screen>
  )
}
