import { getAdminUsers } from './adminUsers'
import { adminDashboardLink } from './notificationLinks'
import { pushNotificationForUser } from './notificationStorage'
import { isSupabaseConfigured } from './supabase'
import { sendNotificationToSupabase } from './supabase/notificationService'
import { buildAdminNewSignupBody, NEW_USER_SIGNUP_TITLE } from './verificationCodes'
import type { User } from '../types'

export async function notifyAdminsOfNewSignup(user: User): Promise<void> {
  if (user.role === 'admin') return

  const admins = await getAdminUsers()
  if (admins.length === 0) return

  const body = buildAdminNewSignupBody(user.name, user.phone ?? '—', user.role)
  await Promise.all(
    admins.map(async (admin) => {
      if (isSupabaseConfigured()) {
        await sendNotificationToSupabase(
          admin.id,
          NEW_USER_SIGNUP_TITLE,
          body,
          adminDashboardLink(user.id),
        )
        return
      }
      await pushNotificationForUser(admin.id, NEW_USER_SIGNUP_TITLE, body, adminDashboardLink(user.id))
    }),
  )
}
