import AsyncStorage from '@react-native-async-storage/async-storage'

const PENDING_REVIEWS_KEY = 'laundry-buddy-pending-review-reminders'

export type PendingReviewReminder = {
  bookingId: string
  hostId: string
  hostName: string
  firstPromptAt: string
  lastReminderAt?: string
}

type PendingReviewMap = Record<string, PendingReviewReminder[]>

async function readMap(): Promise<PendingReviewMap> {
  const raw = await AsyncStorage.getItem(PENDING_REVIEWS_KEY)
  if (!raw) return {}
  return JSON.parse(raw) as PendingReviewMap
}

async function writeMap(map: PendingReviewMap): Promise<void> {
  await AsyncStorage.setItem(PENDING_REVIEWS_KEY, JSON.stringify(map))
}

export async function loadPendingReviewReminders(userId: string): Promise<PendingReviewReminder[]> {
  const map = await readMap()
  return map[userId] ?? []
}

export async function registerPendingReviewReminder(
  userId: string,
  input: Pick<PendingReviewReminder, 'bookingId' | 'hostId' | 'hostName'>,
): Promise<void> {
  const map = await readMap()
  const list = map[userId] ?? []
  if (list.some((entry) => entry.bookingId === input.bookingId)) return

  map[userId] = [
    {
      ...input,
      firstPromptAt: new Date().toISOString(),
    },
    ...list,
  ]
  await writeMap(map)
}

export async function clearPendingReviewReminder(
  userId: string,
  bookingId: string,
): Promise<void> {
  const map = await readMap()
  const list = map[userId] ?? []
  const next = list.filter((entry) => entry.bookingId !== bookingId)
  if (next.length === list.length) return
  map[userId] = next
  await writeMap(map)
}

export async function markReviewReminderSent(
  userId: string,
  bookingId: string,
): Promise<void> {
  const map = await readMap()
  const list = map[userId] ?? []
  const now = new Date().toISOString()
  map[userId] = list.map((entry) =>
    entry.bookingId === bookingId ? { ...entry, lastReminderAt: now } : entry,
  )
  await writeMap(map)
}

export const REVIEW_FOLLOW_UP_DELAY_MS = 30 * 60 * 1000
export const REVIEW_DAILY_REMINDER_MS = 24 * 60 * 60 * 1000

export function shouldSendReviewReminder(entry: PendingReviewReminder, nowMs = Date.now()): boolean {
  const firstPromptMs = Date.parse(entry.firstPromptAt)
  if (Number.isNaN(firstPromptMs)) return false

  if (!entry.lastReminderAt) {
    return nowMs >= firstPromptMs + REVIEW_FOLLOW_UP_DELAY_MS
  }

  const lastReminderMs = Date.parse(entry.lastReminderAt)
  if (Number.isNaN(lastReminderMs)) return false
  return nowMs >= lastReminderMs + REVIEW_DAILY_REMINDER_MS
}
