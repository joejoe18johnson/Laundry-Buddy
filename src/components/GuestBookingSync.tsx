import { useEffect } from 'react'
import { AppState } from 'react-native'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { subscribeToBookingChanges } from '../lib/supabase/bookingService'

/** Keeps guest load timelines in sync when the host advances stages on another session. */
export function GuestBookingSync() {
  const { user } = useAuth()
  const { refreshGuestBookings } = useApp()

  useEffect(() => {
    if (user?.role !== 'customer') return

    void refreshGuestBookings()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshGuestBookings()
      }
    })

    const interval = setInterval(() => {
      void refreshGuestBookings()
    }, 5000)

    const unsubscribeBookings = subscribeToBookingChanges(() => {
      void refreshGuestBookings()
    })

    return () => {
      subscription.remove()
      clearInterval(interval)
      unsubscribeBookings()
    }
  }, [refreshGuestBookings, user?.id, user?.role])

  return null
}
