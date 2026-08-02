import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../AppIcon'
import { useTheme } from '../../context/ThemeContext'
import { REVIEWS_PAGE_SIZE, sliceReviewsPage } from '../../lib/reviewStorage'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'
import type { HostReview } from '../../types'

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
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
    stars: { flexDirection: 'row', gap: 2 },
    seeMoreBtn: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginTop: spacing.sm,
    },
    seeMoreText: { fontSize: 14, fontWeight: '600', color: colors.gray600 },
  })
}

function Stars({
  rating,
  size = 12,
  styles,
  colors,
}: {
  rating: number
  size?: number
  styles: ReturnType<typeof createStyles>
  colors: ReturnType<typeof useTheme>['colors']
}) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <AppIcon
          key={n}
          name="star"
          size={size}
          color={n <= Math.round(rating) ? colors.accent : colors.gray200}
        />
      ))}
    </View>
  )
}

function ReviewCard({
  review,
  styles,
  colors,
}: {
  review: HostReview
  styles: ReturnType<typeof createStyles>
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
        <Stars rating={review.rating} styles={styles} colors={colors} />
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  )
}

export function HostReviewsList({ reviews }: { reviews: HostReview[] }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PAGE_SIZE)

  const visibleReviews = sliceReviewsPage(reviews, visibleCount)
  const hasMore = reviews.length > visibleReviews.length

  return (
    <>
      {visibleReviews.map((review) => (
        <ReviewCard key={review.id} review={review} styles={styles} colors={colors} />
      ))}
      {hasMore ? (
        <Pressable
          style={styles.seeMoreBtn}
          onPress={() => setVisibleCount((count) => count + REVIEWS_PAGE_SIZE)}
          accessibilityRole="button"
        >
          <Text style={styles.seeMoreText}>
            {toTitleCase(`See more (${reviews.length - visibleReviews.length} left)`)}
          </Text>
          <AppIcon name="chevron-down" size={16} color={colors.gray600} />
        </Pressable>
      ) : null}
    </>
  )
}
