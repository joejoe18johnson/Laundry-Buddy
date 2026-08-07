import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { StarRating } from '../../components/StarRating'
import { AppTextInput, BackButton, PrimaryButton, Screen, useScreenScroll } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { getHostById } from '../../data/mockData'
import { formatHostDisplayName } from '../../lib/displayName'
import { hasReviewForBooking, resolveBookingReviewEligibility } from '../../lib/reviewEligibility'
import { resolveSupabaseProfileId } from '../../lib/supabase/profileIds'
import { isSupabaseConfigured } from '../../lib/supabase/config'
import { titleCaseWithName, toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'

function createLeaveReviewStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    centered: { flexGrow: 1, justifyContent: 'center', gap: spacing.md },
    emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', color: colors.black },
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
    hostInitial: { fontSize: 28, fontWeight: '700', color: colors.black },
    title: { fontSize: 24, fontWeight: '700', lineHeight: 30, color: colors.black },
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
    ratingWrap: { alignItems: 'center', gap: spacing.sm },
    ratingHint: { fontSize: 14, color: colors.gray600, textAlign: 'center' },
    commentInput: { minHeight: 120, textAlignVertical: 'top' },
    charHint: { fontSize: 12, color: colors.gray500 },
    doneCard: {
      gap: spacing.md,
      backgroundColor: colors.greenBg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.green,
      padding: spacing.lg,
    },
    doneBody: { gap: 4 },
    doneTitle: { fontSize: 16, fontWeight: '700', color: colors.black },
    doneSub: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  })
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
    guestBookings,
  } = useApp()
  const { colors } = useTheme()
  const styles = useMemo(() => createLeaveReviewStyles(colors), [colors])

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [reviewUnavailable, setReviewUnavailable] = useState(false)
  const screenScroll = useScreenScroll()

  const host = reviewHostId ? getHostById(reviewHostId) : undefined
  const displayName = host ? formatHostDisplayName(host.name) : ''

  useEffect(() => {
    setRating(0)
    setComment('')
    setAlreadyReviewed(false)
    setReviewUnavailable(false)
    setChecking(true)
  }, [reviewHostId, reviewBookingId])

  useEffect(() => {
    let cancelled = false

    if (!user || !reviewHostId) {
      setChecking(false)
      return
    }

    if (reviewBookingId) {
      void (async () => {
        const { eligible } = await resolveBookingReviewEligibility(reviewBookingId, guestBookings)
        if (!eligible) {
          if (!cancelled) {
            setReviewUnavailable(true)
            setChecking(false)
          }
          return
        }

        const resolvedAuthorId = isSupabaseConfigured()
          ? ((await resolveSupabaseProfileId(user)) ?? user.id)
          : user.id
        const reviewed = await hasReviewForBooking(
          user.id,
          reviewBookingId,
          resolvedAuthorId,
        )
        if (!cancelled) {
          setAlreadyReviewed(reviewed)
          setChecking(false)
        }
      })()
      return () => {
        cancelled = true
      }
    }

    const existing = getReviewsForHost(reviewHostId)
    if (!cancelled) {
      setAlreadyReviewed(existing.some((review) => review.author === user.name))
      setChecking(false)
    }

    return () => {
      cancelled = true
    }
  }, [reviewHostId, reviewBookingId, user?.id, getReviewsForHost])

  if (!reviewHostId || !host) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.emptyTitle}>{toTitleCase('Review unavailable')}</Text>
        <Text style={styles.emptySub}>{toTitleCase('We could not find this host.')}</Text>
        <PrimaryButton title="Go home" icon="home" onPress={() => navigate('customer-home')} full />
      </Screen>
    )
  }

  if (reviewUnavailable) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.emptyTitle}>{toTitleCase('Review unavailable')}</Text>
        <Text style={styles.emptySub}>
          {toTitleCase('Reviews are only available for completed loads that were not cancelled or declined.')}
        </Text>
        <PrimaryButton title="Go home" icon="home" onPress={() => navigate('customer-home')} full />
      </Screen>
    )
  }

  const canSubmit = rating > 0 && comment.trim().length >= 8 && !submitting && !alreadyReviewed

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const saved = await submitHostReview({
        hostId: host.id,
        bookingId: reviewBookingId,
        rating,
        comment: comment.trim(),
      })
      if (saved) {
        setAlreadyReviewed(true)
        viewHostProfile(host)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <BackButton onPress={() => navigate('customer-home')} label="Home" />

      <View style={styles.header}>
        <View style={styles.hostAvatar}>
          <Text style={styles.hostInitial}>{displayName[0]}</Text>
        </View>
        <Text style={styles.title}>Rate {displayName}</Text>
        <Text style={styles.subtitle}>
          {titleCaseWithName(
            titleCaseWithName(
              `How was your pickup with ${displayName} in ${host.location}?`,
              displayName,
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
            <View style={styles.ratingWrap}>
              <StarRating
                rating={rating}
                size={40}
                filledColor={colors.black}
                emptyColor={colors.gray200}
                interactive
                onChange={setRating}
              />
            </View>
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
              onFocus={() => {
                setTimeout(() => screenScroll?.scrollToEnd(), 100)
              }}
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
