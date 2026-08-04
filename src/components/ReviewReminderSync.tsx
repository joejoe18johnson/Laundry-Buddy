import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { hostReviewLink } from '../lib/notificationLinks'
import { canLeaveReviewForBooking, hasReviewForBooking } from '../lib/reviewEligibility'
import {
  clearPendingReviewReminder,
  loadPendingReviewReminders,
  markReviewReminderSent,
  registerPendingReviewReminder,
  shouldSendReviewReminder,
} from '../lib/reviewReminderStorage'
import { resolveSupabaseProfileId } from '../lib/supabase/profileIds'
import { isSupabaseConfigured } from '../lib/supabase/config'

/** Nudges guests to leave a review 30 min after pickup, then daily until they do. */
export function ReviewReminderSync() {
  const { user } = useAuth()
  const { push } = useNotifications()
  const { guestBookings } = useApp()
  const runningRef = useRef(false)

  useEffect(() => {
    if (user?.role !== 'customer' || !user.id) return

    const sync = async () => {
      if (runningRef.current) return
      runningRef.current = true

      try {
        const resolvedAuthorId = isSupabaseConfigured()
          ? ((await resolveSupabaseProfileId(user)) ?? user.id)
          : user.id

        for (const booking of guestBookings) {
          if (!canLeaveReviewForBooking(booking) || !booking.customerId) {
            if (booking.id) {
              await clearPendingReviewReminder(user.id, booking.id)
            }
            continue
          }

          const reviewed = await hasReviewForBooking(user.id, booking.id, resolvedAuthorId)
          if (reviewed) {
            await clearPendingReviewReminder(user.id, booking.id)
            continue
          }

          await registerPendingReviewReminder(user.id, {
            bookingId: booking.id,
            hostId: booking.hostId,
            hostName: booking.hostName,
          })
        }

        const pending = await loadPendingReviewReminders(user.id)
        for (const entry of pending) {
          const booking = guestBookings.find((item) => item.id === entry.bookingId)
          if (booking && !canLeaveReviewForBooking(booking)) {
            await clearPendingReviewReminder(user.id, entry.bookingId)
            continue
          }

          const reviewed = await hasReviewForBooking(user.id, entry.bookingId, resolvedAuthorId)
          if (reviewed) {
            await clearPendingReviewReminder(user.id, entry.bookingId)
            continue
          }

          if (!shouldSendReviewReminder(entry)) continue

          await push(
            user.id,
            'Leave A Review',
            `How was your load with ${entry.hostName}? Your review helps other guests find trusted hosts.`,
            hostReviewLink(entry.hostId, entry.bookingId),
          )
          await markReviewReminderSent(user.id, entry.bookingId)
        }
      } finally {
        runningRef.current = false
      }
    }

    void sync()
    const interval = setInterval(() => void sync(), 60_000)
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync()
    })

    return () => {
      clearInterval(interval)
      subscription.remove()
    }
  }, [guestBookings, push, user?.id, user?.role])

  return null
}
