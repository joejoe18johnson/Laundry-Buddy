import { useCallback, useEffect, useRef, useState } from 'react'
import { HostBookingWalkthrough } from './HostBookingWalkthrough'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useUserNotifications } from '../context/NotificationContext'
import { canBookOrHost } from '../lib/identityVerification'
import { onHostBookingWalkthroughRequested } from '../lib/hostWalkthroughQueue'
import {
  hasSeenHostBookingWalkthrough,
  markHostBookingWalkthroughSeen,
} from '../lib/hostWalkthroughStorage'
import { hasSeenVerificationTour } from '../lib/verificationTourStorage'
import { VERIFICATION_APPROVED_TITLE } from '../lib/verificationCodes'

export function HostWalkthroughSync() {
  const { user } = useAuth()
  const { navigate } = useApp()
  const { notifications } = useUserNotifications(user?.id)
  const [visible, setVisible] = useState(false)
  const [persistSeen, setPersistSeen] = useState(true)
  const checkingRef = useRef(false)

  const closeWalkthrough = useCallback(async () => {
    setVisible(false)
    if (persistSeen && user) {
      await markHostBookingWalkthroughSeen(user.id)
    }
    setPersistSeen(true)
  }, [persistSeen, user])

  const finishWalkthrough = useCallback(async () => {
    await closeWalkthrough()
    navigate('host-dashboard')
  }, [closeWalkthrough, navigate])

  const tryAutoShow = useCallback(async () => {
    if (!user || user.role !== 'host' || !canBookOrHost(user)) return
    if (checkingRef.current) return

    checkingRef.current = true
    try {
      if (await hasSeenHostBookingWalkthrough(user.id)) return

      const seenVerificationTour = await hasSeenVerificationTour(user.id)
      const pendingVerificationTour =
        !seenVerificationTour &&
        notifications.some((entry) => !entry.read && entry.title === VERIFICATION_APPROVED_TITLE)

      if (pendingVerificationTour) return

      await new Promise((resolve) => setTimeout(resolve, seenVerificationTour ? 400 : 900))
      if (await hasSeenHostBookingWalkthrough(user.id)) return

      setPersistSeen(true)
      setVisible(true)
    } finally {
      checkingRef.current = false
    }
  }, [notifications, user])

  useEffect(() => {
    void tryAutoShow()
  }, [tryAutoShow])

  useEffect(() => {
    return onHostBookingWalkthroughRequested(({ replay }) => {
      if (!user || user.role !== 'host') return
      setPersistSeen(!replay)
      setVisible(true)
    })
  }, [user])

  if (!user || user.role !== 'host') return null

  return (
    <HostBookingWalkthrough
      visible={visible}
      onComplete={() => void finishWalkthrough()}
      onDismiss={() => void closeWalkthrough()}
    />
  )
}
