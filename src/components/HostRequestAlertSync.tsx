import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppState } from 'react-native'
import { HostNewRequestPopup } from './HostNewRequestPopup'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useUserNotifications } from '../context/NotificationContext'
import { hasOpenHostLoad } from '../lib/hostLoads'
import { isNewBookingNotification } from '../lib/hostNotifications'
import type { HostRequest } from '../types'

/** Surfaces new guest load requests with an in-app popup and keeps host orders in sync. */
export function HostRequestAlertSync() {
  const { user } = useAuth()
  const { notifications, markRead } = useUserNotifications(user?.id)
  const {
    hostRequests,
    activeLoads,
    refreshHostOrders,
    acceptRequest,
    declineRequest,
    navigate,
  } = useApp()

  const hostLoadInProgress = useMemo(() => hasOpenHostLoad(activeLoads), [activeLoads])

  const [visibleRequest, setVisibleRequest] = useState<HostRequest | null>(null)
  const [dismissedPopupIds, setDismissedPopupIds] = useState<string[]>([])

  const unseenRequests = useMemo(
    () => hostRequests.filter((request) => !dismissedPopupIds.includes(request.id)),
    [dismissedPopupIds, hostRequests],
  )

  const markSeen = useCallback((requestId: string) => {
    setDismissedPopupIds((prev) => (prev.includes(requestId) ? prev : [...prev, requestId]))
  }, [])

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
    }, 12000)

    return () => {
      subscription.remove()
      clearInterval(interval)
    }
  }, [refreshHostOrders, user?.id, user?.role])

  useEffect(() => {
    if (user?.role !== 'host') return

    const unreadBookingAlerts = notifications.filter(
      (entry) => !entry.read && isNewBookingNotification(entry.title),
    )
    if (unreadBookingAlerts.length === 0) return

    void refreshHostOrders().then(() => {
      for (const entry of unreadBookingAlerts) {
        void markRead(entry.id)
      }
    })
  }, [markRead, notifications, refreshHostOrders, user?.role])

  useEffect(() => {
    if (user?.role !== 'host') return
    if (visibleRequest) return
    if (hostLoadInProgress) return
    if (unseenRequests.length === 0) return
    setVisibleRequest(unseenRequests[0])
  }, [hostLoadInProgress, unseenRequests, user?.role, visibleRequest])

  const closePopup = useCallback(
    (requestId: string, goToDashboard: boolean) => {
      markSeen(requestId)
      setVisibleRequest(null)
      if (goToDashboard) {
        navigate('host-dashboard')
      }
    },
    [markSeen, navigate],
  )

  const handleAccept = useCallback(() => {
    if (!visibleRequest) return
    acceptRequest(visibleRequest.id)
    closePopup(visibleRequest.id, false)
  }, [acceptRequest, closePopup, visibleRequest])

  const handleDecline = useCallback(() => {
    if (!visibleRequest) return
    declineRequest(visibleRequest.id)
    closePopup(visibleRequest.id, true)
  }, [closePopup, declineRequest, visibleRequest])

  const handleLater = useCallback(() => {
    if (!visibleRequest) return
    closePopup(visibleRequest.id, true)
  }, [closePopup, visibleRequest])

  if (user?.role !== 'host') return null

  return (
    <HostNewRequestPopup
      visible={!!visibleRequest}
      request={visibleRequest}
      queueCount={unseenRequests.length}
      onAccept={handleAccept}
      onDecline={handleDecline}
      onLater={handleLater}
    />
  )
}
