import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { AppTextInput, BackButton, PrimaryButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { getHostById } from '../../data/mockData'
import { hasReviewedBooking } from '../../lib/reviewStorage'
import { titleCaseWithName, toTitleCase } from '../../lib/titleCase'
import { colors, radius, spacing } from '../../theme'

function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (rating: number) => void
}) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value
        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${star} stars`}
          >
            <AppIcon name="star" size={40} color={filled ? colors.black : colors.gray200} />
          </Pressable>
        )
      })}
    </View>
  )
}

export function LeaveReviewScreen() {
  const { user } = useAuth()
  const {
    reviewHostId,
    reviewBookingId,
    navigate,
    submitHostReview,
    viewHostProfile,
    getReviewsForHost,
  } = useApp()

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [checking, setChecking] = useState(true)

  const host = reviewHostId ? getHostById(reviewHostId) : undefined

  useEffect(() => {
    let cancelled = false
    setRating(0)
    setComment('')
    setAlreadyReviewed(false)

    if (!user || !reviewHostId) {
      setChecking(false)
      return
    }

    if (reviewBookingId) {
      void hasReviewedBooking(user.id, reviewBookingId).then((reviewed) => {
        if (!cancelled) {
          setAlreadyReviewed(reviewed)
          setChecking(false)
        }
      })
      return
    }

    const existing = getReviewsForHost(reviewHostId)
    if (!cancelled) {
      setAlreadyReviewed(existing.some((review) => review.author === user.name))
      setChecking(false)
    }

    return () => {
      cancelled = true
    }
  }, [reviewHostId, reviewBookingId, user, getReviewsForHost])

  if (!reviewHostId || !host) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.emptyTitle}>{toTitleCase('Review unavailable')}</Text>
        <Text style={styles.emptySub}>{toTitleCase('We could not find this host.')}</Text>
        <PrimaryButton title="Go home" icon="home" onPress={() => navigate('customer-home')} full />
      </Screen>
    )
  }

  const canSubmit = rating > 0 && comment.trim().length >= 8 && !submitting && !alreadyReviewed

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await submitHostReview({
        hostId: host.id,
        bookingId: reviewBookingId,
        rating,
        comment: comment.trim(),
      })
      viewHostProfile(host)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <BackButton onPress={() => navigate('customer-home')} label="Home" />

      <View style={styles.header}>
        <View style={styles.hostAvatar}>
          <Text style={styles.hostInitial}>{host.name[0]}</Text>
        </View>
        <Text style={styles.title}>Rate {host.name}</Text>
        <Text style={styles.subtitle}>
          {titleCaseWithName(
            titleCaseWithName(
              `How was your pickup with ${host.name} in ${host.location}?`,
              host.name,
            ),
            host.location,
          )}
        </Text>
      </View>

      {checking ? (
        <Text style={styles.checking}>{toTitleCase('Checking your review status…')}</Text>
      ) : alreadyReviewed ? (
        <View style={styles.doneCard}>
          <AppIcon name="check-circle" size={22} color={colors.green} />
          <View style={styles.doneBody}>
            <Text style={styles.doneTitle}>{toTitleCase('Review already submitted')}</Text>
            <Text style={styles.doneSub}>{toTitleCase('Thanks for sharing feedback on this load.')}</Text>
          </View>
          <PrimaryButton title="View host profile" icon="user" full onPress={() => viewHostProfile(host)} />
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{toTitleCase('Your rating')}</Text>
            <StarPicker value={rating} onChange={setRating} />
            <Text style={styles.ratingHint}>
              {rating === 0 ? toTitleCase('Tap a star to rate') : `${rating} out of 5`}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{toTitleCase('Your review')}</Text>
            <AppTextInput
              multiline
              value={comment}
              onChangeText={setComment}
              placeholder="Share how drop-off, drying, and pickup went…"
              style={styles.commentInput}
            />
            <Text style={styles.charHint}>
              {comment.trim().length < 8
                ? toTitleCase('Write at least 8 characters')
                : `${comment.trim().length} characters`}
            </Text>
          </View>

          <PrimaryButton
            title={submitting ? 'Submitting…' : 'Submit review'}
            icon="star"
            full
            disabled={!canSubmit}
            onPress={() => void handleSubmit()}
          />
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  centered: { flexGrow: 1, justifyContent: 'center', gap: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 14, color: colors.gray500, textAlign: 'center', marginBottom: spacing.md },
  header: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm },
  hostAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  hostInitial: { fontSize: 28, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  subtitle: { fontSize: 15, color: colors.gray600, textAlign: 'center', lineHeight: 22 },
  checking: { fontSize: 14, color: colors.gray500, textAlign: 'center' },
  section: {
    backgroundColor: colors.gray50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray500,
    letterSpacing: 0.4,
  },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  ratingHint: { fontSize: 14, color: colors.gray600, textAlign: 'center' },
  commentInput: { minHeight: 120 },
  charHint: { fontSize: 12, color: colors.gray500 },
  doneCard: {
    gap: spacing.md,
    backgroundColor: colors.greenBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,138,5,0.15)',
    padding: spacing.lg,
  },
  doneBody: { gap: 4 },
  doneTitle: { fontSize: 16, fontWeight: '700' },
  doneSub: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
})
