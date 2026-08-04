import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { registerPushTokenForUser } from '../lib/supabase/notificationService'
import { getPushPermissionStatus, promptForPushNotifications } from '../lib/pushNotifications'

export type CriticalNotificationContext =
  | 'login'
  | 'booking'
  | 'tracking'
  | 'verification'
  | 'messages'
  | 'host-dashboard'

/**
 * Prompt for native OS notification permission at a critical UX moment.
 * Each context only auto-prompts once per app session to avoid nagging.
 */
export function useCriticalNotificationPrompt(context: CriticalNotificationContext) {
  const { user } = useAuth()
  const promptedRef = useRef(false)

  useEffect(() => {
    if (!user || promptedRef.current) return
    promptedRef.current = true

    void (async () => {
      const current = await getPushPermissionStatus()
      if (current === 'granted' || current === 'unsupported') {
        if (current === 'granted') {
          await registerPushTokenForUser(user)
        }
        return
      }

      const status = await promptForPushNotifications()
      if (status === 'granted') {
        await registerPushTokenForUser(user)
      }
    })()
  }, [context, user])
}

/** One-shot prompt before a critical action (e.g. sending a booking request). */
export async function promptNotificationsBeforeAction(
  user: { id: string; phone?: string; email?: string } | null | undefined,
): Promise<boolean> {
  if (!user) return false

  const current = await getPushPermissionStatus()
  if (current === 'granted' || current === 'unsupported') {
    if (current === 'granted') {
      await registerPushTokenForUser(user)
    }
    return current === 'granted'
  }

  const status = await promptForPushNotifications()
  if (status === 'granted') {
    await registerPushTokenForUser(user)
    return true
  }
  return false
}
