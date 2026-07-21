import { useEffect } from 'react'
import { AppState } from 'react-native'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

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
    }, 12000)

    return () => {
      subscription.remove()
      clearInterval(interval)
    }
  }, [refreshGuestBookings, user?.id, user?.role])

  return null
}
