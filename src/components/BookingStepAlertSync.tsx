import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookingStepPopup } from './BookingStepPopup'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import {
  detectGuestStepEvents,
  detectHostStepEvents,
  linkForBookingStepEvent,
  toBookingStepSnapshot,
  type BookingStepEvent,
  type BookingStepEventKind,
  type BookingStepSnapshot,
} from '../lib/bookingStepEvents'
import { isRemoteNotificationSyncEnabled } from '../lib/supabase/notificationService'

const GUEST_TRACKING_EVENTS: BookingStepEventKind[] = [
  'request-sent',
  'request-accepted',
  'payment-requested',
  'payment-proof-submitted',
  'payment-confirmed',
  'bag-received',
  'drying-started',
  'ready-for-pickup',
  'host-pickup-confirmed',
]

const HOST_DRYER_EVENTS: BookingStepEventKind[] = [
  'payment-proof-sent',
  'payment-confirmed',
  'bag-received',
  'drying-started',
  'ready-for-pickup',
  'guest-pickup-confirmed',
  'picked-up',
]

/** Surfaces booking milestone updates (payment, drying, ready, done) with in-app popups. */
export function BookingStepAlertSync() {
  const { user } = useAuth()
  const { push } = useNotifications()
  const {
    guestBookings,
    activeLoads,
    navigate,
    selectGuestBooking,
    openLeaveReview,
  } = useApp()

  const previousSnapshotsRef = useRef<Map<string, BookingStepSnapshot> | null>(null)
  const seenEventIdsRef = useRef<Set<string>>(new Set())
  const pushedEventIdsRef = useRef<Set<string>>(new Set())
  const remoteSyncEnabled = isRemoteNotificationSyncEnabled()
  const [queue, setQueue] = useState<BookingStepEvent[]>([])
  const [visibleEvent, setVisibleEvent] = useState<BookingStepEvent | null>(null)

  const watchedBookings = useMemo(() => {
    if (user?.role === 'customer') return guestBookings
    if (user?.role === 'host') return activeLoads
    return []
  }, [activeLoads, guestBookings, user?.role])

  useEffect(() => {
    if (user?.role !== 'customer' && user?.role !== 'host') return

    const currentMap = new Map(watchedBookings.map((booking) => [booking.id, toBookingStepSnapshot(booking)]))

    if (previousSnapshotsRef.current === null) {
      previousSnapshotsRef.current = currentMap
      return
    }

    const events =
      user.role === 'customer'
        ? detectGuestStepEvents(previousSnapshotsRef.current, watchedBookings)
        : detectHostStepEvents(previousSnapshotsRef.current, watchedBookings)

    previousSnapshotsRef.current = currentMap

    const freshEvents = events.filter((event) => !seenEventIdsRef.current.has(event.id))
    if (freshEvents.length === 0) return

    for (const event of freshEvents) {
      seenEventIdsRef.current.add(event.id)
    }

    if (user?.id && (user.role === 'customer' || user.role === 'host')) {
      const role = user.role
      for (const event of freshEvents) {
        if (pushedEventIdsRef.current.has(event.id)) continue
        pushedEventIdsRef.current.add(event.id)
        if (remoteSyncEnabled) continue
        void push(user.id, event.title, event.body, linkForBookingStepEvent(event, role))
      }
    }

    setQueue((prev) => [...prev, ...freshEvents])
  }, [push, remoteSyncEnabled, user?.id, user?.role, watchedBookings])

  useEffect(() => {
    if (visibleEvent) return
    if (queue.length === 0) return
    setVisibleEvent(queue[0])
  }, [queue, visibleEvent])

  const closePopup = useCallback((event: BookingStepEvent, goToDestination: boolean) => {
    setVisibleEvent(null)
    setQueue((prev) => prev.filter((entry) => entry.id !== event.id))

    if (!goToDestination) return

    if (user?.role === 'customer') {
      if (event.kind === 'picked-up') {
        openLeaveReview(event.hostId, event.bookingId)
        return
      }
      if (event.kind === 'request-declined') {
        navigate('customer-home')
        return
      }
      if (GUEST_TRACKING_EVENTS.includes(event.kind)) {
        selectGuestBooking(event.bookingId)
        navigate('customer-tracking')
        return
      }
      selectGuestBooking(event.bookingId)
      navigate('customer-tracking')
      return
    }

    if (user?.role === 'host') {
      if (HOST_DRYER_EVENTS.includes(event.kind)) {
        navigate('host-dryer')
        return
      }
      navigate('host-dashboard')
      return
    }

    navigate('host-dashboard')
  }, [navigate, openLeaveReview, selectGuestBooking, user?.role])

  const handlePrimary = useCallback(() => {
    if (!visibleEvent) return
    closePopup(visibleEvent, true)
  }, [closePopup, visibleEvent])

  const handleDismiss = useCallback(() => {
    if (!visibleEvent) return
    closePopup(visibleEvent, false)
  }, [closePopup, visibleEvent])

  if (user?.role !== 'customer' && user?.role !== 'host') return null

  return (
    <BookingStepPopup
      visible={!!visibleEvent}
      event={visibleEvent}
      queueCount={queue.length}
      onPrimary={handlePrimary}
      onDismiss={handleDismiss}
    />
  )
}
