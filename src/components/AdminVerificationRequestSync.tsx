import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { adminDashboardLink } from '../lib/notificationLinks'
import { ensurePushNotificationsEnabled } from '../lib/pushNotifications'
import { listOpenVerificationCodeRequests } from '../lib/verificationCodeService'
import {
  buildAdminVerificationRequestBody,
  VERIFICATION_CODE_REQUEST_TITLE,
} from '../lib/verificationCodes'
import type { VerificationCodeRequest } from '../lib/verificationRequestStorage'

const SEEN_REQUESTS_KEY = 'laundry-buddy-admin-seen-vcode-requests'
const POLL_MS = 12000

function requestAlertKey(request: VerificationCodeRequest): string {
  return `${request.userId}:${request.requestedAt}:${request.status}`
}

async function readSeenRequestKeys(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(SEEN_REQUESTS_KEY)
  if (!raw) return new Set()
  try {
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

async function writeSeenRequestKeys(keys: Set<string>): Promise<void> {
  await AsyncStorage.setItem(SEEN_REQUESTS_KEY, JSON.stringify(Array.from(keys)))
}

type Props = {
  onNewRequest?: () => void
}

/** Polls for new WhatsApp verification code requests and alerts the signed-in admin. */
export function AdminVerificationRequestSync({ onNewRequest }: Props) {
  const { user } = useAuth()
  const { push } = useNotifications()
  const seenKeysRef = useRef<Set<string>>(new Set())
  const readyRef = useRef(false)

  useEffect(() => {
    if (user?.role !== 'admin') return
    void ensurePushNotificationsEnabled()
  }, [user?.id, user?.role])

  useEffect(() => {
    if (user?.role !== 'admin') return

    let cancelled = false
    void readSeenRequestKeys().then((keys) => {
      if (cancelled) return
      seenKeysRef.current = keys
      readyRef.current = true
    })

    return () => {
      cancelled = true
    }
  }, [user?.id, user?.role])

  const syncPendingRequests = useCallback(async () => {
    if (user?.role !== 'admin' || !readyRef.current) return

    const requests = await listOpenVerificationCodeRequests()
    const pending = requests.filter((entry) => entry.status === 'pending')
    let addedNew = false

    for (const request of pending) {
      const key = requestAlertKey(request)
      if (seenKeysRef.current.has(key)) continue

      seenKeysRef.current.add(key)
      addedNew = true

      await push(
        user.id,
        VERIFICATION_CODE_REQUEST_TITLE,
        buildAdminVerificationRequestBody(request.userName, request.phone),
        adminDashboardLink(request.userId),
      )
    }

    if (addedNew) {
      await writeSeenRequestKeys(seenKeysRef.current)
      onNewRequest?.()
    }
  }, [onNewRequest, push, user?.id, user?.role])

  useEffect(() => {
    if (user?.role !== 'admin') return

    void syncPendingRequests()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncPendingRequests()
      }
    })

    const interval = setInterval(() => {
      void syncPendingRequests()
    }, POLL_MS)

    return () => {
      subscription.remove()
      clearInterval(interval)
    }
  }, [syncPendingRequests, user?.role])

  return null
}
