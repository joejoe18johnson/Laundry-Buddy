import { useEffect, useRef } from 'react'
import { Alert, AppState } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useUserNotifications } from '../context/NotificationContext'
import { getIdentityVerification } from '../lib/identityVerification'
import { toTitleCase } from '../lib/titleCase'
import { VERIFICATION_APPROVED_TITLE } from '../lib/verificationCodes'

function verificationApprovedAlertMessage(role: 'customer' | 'host'): string {
  if (role === 'host') {
    return toTitleCase(
      'Your ID and address are approved. You are fully verified — hosting is unlocked and you will not need to complete verification again.',
    )
  }
  return toTitleCase(
    'Your ID is approved. You are fully verified — booking is unlocked and you will not need to complete verification again.',
  )
}

function showVerificationApprovedAlert(role: 'customer' | 'host') {
  Alert.alert(
    toTitleCase("You're verified!"),
    verificationApprovedAlertMessage(role),
    [{ text: toTitleCase('Great') }],
  )
}

/** Keeps the signed-in user in sync after admin approval and shows a verified popup. */
export function VerificationStatusSync() {
  const { user, refreshCurrentUser } = useAuth()
  const { notifications, markRead } = useUserNotifications(user?.id)
  const previousStatusRef = useRef<string | null>(null)
  const alertedRef = useRef(false)

  useEffect(() => {
    if (!user || user.role === 'admin') return

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshCurrentUser()
      }
    })

    return () => subscription.remove()
  }, [refreshCurrentUser, user])

  useEffect(() => {
    if (!user || user.role === 'admin') return

    const unreadApproved = notifications.find(
      (entry) => !entry.read && entry.title === VERIFICATION_APPROVED_TITLE,
    )
    if (unreadApproved) {
      void refreshCurrentUser()
    }
  }, [notifications, refreshCurrentUser, user])

  useEffect(() => {
    if (!user || user.role === 'admin') return

    const status = getIdentityVerification(user).status
    const previous = previousStatusRef.current
    previousStatusRef.current = status

    if (status !== 'verified') {
      alertedRef.current = false
      return
    }

    const role = user.role === 'host' ? 'host' : 'customer'
    const unreadApproved = notifications.find(
      (entry) => !entry.read && entry.title === VERIFICATION_APPROVED_TITLE,
    )

    const justVerified = previous !== null && previous !== 'verified'
    const shouldAlert =
      !alertedRef.current && (justVerified || !!unreadApproved)

    if (!shouldAlert) return

    alertedRef.current = true
    showVerificationApprovedAlert(role)
    if (unreadApproved) {
      void markRead(unreadApproved.id)
    }
  }, [markRead, notifications, user])

  return null
}
