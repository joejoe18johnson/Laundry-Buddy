import { Platform } from 'react-native'
import type { AppNotification, NotificationLink } from '../../types'
import { isSupabaseConfigured } from './config'
import { getSupabaseClient } from './client'
import type { Database } from './database.types'

type NotificationRow = Database['public']['Tables']['notifications']['Row']

function formatNotificationTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function rowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    time: formatNotificationTime(row.created_at),
    read: row.read,
    link: (row.link as NotificationLink | null) ?? undefined,
  }
}

export async function fetchNotificationsFromSupabase(userId: string): Promise<AppNotification[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) return []
  return data.map(rowToNotification)
}

export async function sendNotificationToSupabase(
  userId: string,
  title: string,
  body: string,
  link?: NotificationLink,
): Promise<AppNotification | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase.rpc('send_app_notification', {
    target_user_id: userId,
    notification_title: title,
    notification_body: body,
    notification_link: link ?? null,
  })

  if (error || !data) return null

  const { data: row, error: fetchError } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', data)
    .maybeSingle()

  if (fetchError || !row) return null
  return rowToNotification(row)
}

export async function markNotificationReadInSupabase(notificationId: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
}

export async function markAllNotificationsReadInSupabase(userId: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
}

export async function upsertPushToken(userId: string, expoPushToken: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: expoPushToken,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' },
  )
}

export function subscribeToNotificationInserts(
  userId: string,
  onInsert: (notification: AppNotification) => void,
): () => void {
  const supabase = getSupabaseClient()
  if (!supabase) return () => {}

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as NotificationRow
        onInsert(rowToNotification(row))
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function isRemoteNotificationSyncEnabled(): boolean {
  return isSupabaseConfigured()
}
