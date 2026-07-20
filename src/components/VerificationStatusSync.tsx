import { useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { VerificationCelebrationTour } from './VerificationCelebrationTour'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useUserNotifications } from '../context/NotificationContext'
import { getIdentityVerification } from '../lib/identityVerification'
import { VERIFICATION_APPROVED_TITLE } from '../lib/verificationCodes'
import { hasSeenVerificationTour, markVerificationTourSeen } from '../lib/verificationTourStorage'

/** Keeps the signed-in user in sync after admin approval and shows a verified tour once. */
export function VerificationStatusSync() {
  const { user, refreshCurrentUser } = useAuth()
  const { navigate } = useApp()
  const { notifications, markRead } = useUserNotifications(user?.id)
  const previousStatusRef = useRef<string | null>(null)
  const checkingTourRef = useRef(false)
  const [tour, setTour] = useState<{ role: 'customer' | 'host' } | null>(null)

  useEffect(() => {
    if (!user || user.role === 'admin') return

    void refreshCurrentUser()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshCurrentUser()
      }
    })

    return () => subscription.remove()
  }, [refreshCurrentUser, user?.id, user?.role])

  useEffect(() => {
    if (!user || user.role === 'admin') return
    if (getIdentityVerification(user).status !== 'pending') return

    void refreshCurrentUser()
    const interval = setInterval(() => {
      void refreshCurrentUser()
    }, 15000)

    return () => clearInterval(interval)
  }, [refreshCurrentUser, user?.id, user?.role, user?.identityVerification?.status])

  useEffect(() => {
    if (!user || user.role === 'admin' || checkingTourRef.current) return

    const showTourIfNeeded = async () => {
      checkingTourRef.current = true
      try {
        const status = getIdentityVerification(user).status
        const previous = previousStatusRef.current
        previousStatusRef.current = status

        if (status !== 'verified') return
        if (await hasSeenVerificationTour(user.id)) return

        const unreadApproved = notifications.find(
          (entry) => !entry.read && entry.title === VERIFICATION_APPROVED_TITLE,
        )

        const justVerified = previous !== null && previous !== 'verified'
        if (!justVerified && !unreadApproved) return

        if (unreadApproved) {
          await markRead(unreadApproved.id)
        }

        setTour({ role: user.role === 'host' ? 'host' : 'customer' })
      } finally {
        checkingTourRef.current = false
      }
    }

    void showTourIfNeeded()
  }, [markRead, notifications, user])

  const finishTour = async (navigateAfter: boolean) => {
    if (!user || !tour) return
    const role = tour.role
    await markVerificationTourSeen(user.id)
    setTour(null)
    if (navigateAfter) {
      navigate(role === 'host' ? 'account' : 'customer-home')
    }
  }

  if (!tour) return null

  return (
    <VerificationCelebrationTour
      visible
      role={tour.role}
      onComplete={() => void finishTour(true)}
      onDismiss={() => void finishTour(false)}
    />
  )
}
