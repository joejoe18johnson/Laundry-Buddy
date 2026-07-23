import { getAdminUsers } from './adminUsers'
import { adminDashboardLink } from './notificationLinks'
import { pushNotificationForUser } from './notificationStorage'
import { buildAdminNewSignupBody, NEW_USER_SIGNUP_TITLE } from './verificationCodes'
import type { User } from '../types'

export async function notifyAdminsOfNewSignup(user: User): Promise<void> {
  if (user.role === 'admin') return

  const admins = await getAdminUsers()
  if (admins.length === 0) return

  const body = buildAdminNewSignupBody(user.name, user.phone ?? '—', user.role)
  await Promise.all(
    admins.map((admin) =>
      pushNotificationForUser(admin.id, NEW_USER_SIGNUP_TITLE, body, adminDashboardLink(user.id)),
    ),
  )
}
