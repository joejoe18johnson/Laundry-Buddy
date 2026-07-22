import { useEffect } from 'react'
import { AppState } from 'react-native'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

/** Keeps host active loads in sync when the guest confirms pickup on another session. */
export function HostBookingSync() {
  const { user } = useAuth()
  const { refreshHostOrders } = useApp()

  useEffect(() => {
    if (user?.role !== 'host') return

    void refreshHostOrders()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshHostOrders()
      }
    })

    const interval = setInterval(() => {
      void refreshHostOrders()
    }, 5000)

    return () => {
      subscription.remove()
      clearInterval(interval)
    }
  }, [refreshHostOrders, user?.id, user?.role])

  return null
}
