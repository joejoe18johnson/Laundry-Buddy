import { registerPushTokenForUser } from '../lib/supabase/notificationService'
import {
  getPushPermissionStatus,
  isPushPermissionBlockedInSettings,
  promptForPushNotifications,
} from '../lib/pushNotifications'

/** One-shot native prompt before a critical action (e.g. sending a booking request). */
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

  if (await isPushPermissionBlockedInSettings()) {
    return false
  }

  const status = await promptForPushNotifications()
  if (status === 'granted') {
    await registerPushTokenForUser(user)
    return true
  }
  return false
}
