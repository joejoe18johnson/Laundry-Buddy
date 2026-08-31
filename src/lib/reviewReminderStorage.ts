import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'laundry-buddy-review-reminders'

const FIRST_REMINDER_MS = 30 * 60 * 1000
const REPEAT_REMINDER_MS = 24 * 60 * 60 * 1000

export type PendingReviewReminder = {
  bookingId: string
  hostId: string
  hostName: string
  registeredAt: string
  lastSentAt?: string
}

type ReminderStore = Record<string, PendingReviewReminder[]>

async function readStore(): Promise<ReminderStore> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as ReminderStore
  } catch {
    return {}
  }
}

async function writeStore(store: ReminderStore): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadPendingReviewReminders(userId: string): Promise<PendingReviewReminder[]> {
  const store = await readStore()
  return store[userId] ?? []
}

export async function registerPendingReviewReminder(
  userId: string,
  entry: Pick<PendingReviewReminder, 'bookingId' | 'hostId' | 'hostName'>,
): Promise<void> {
  const store = await readStore()
  const list = store[userId] ?? []
  const existing = list.find((item) => item.bookingId === entry.bookingId)

  if (existing) {
    existing.hostId = entry.hostId
    existing.hostName = entry.hostName
  } else {
    list.push({
      ...entry,
      registeredAt: new Date().toISOString(),
    })
  }

  store[userId] = list
  await writeStore(store)
}

export async function clearPendingReviewReminder(userId: string, bookingId: string): Promise<void> {
  const store = await readStore()
  const list = store[userId]
  if (!list?.length) return

  const next = list.filter((item) => item.bookingId !== bookingId)
  if (next.length === list.length) return

  if (next.length === 0) {
    delete store[userId]
  } else {
    store[userId] = next
  }
  await writeStore(store)
}

export async function markReviewReminderSent(userId: string, bookingId: string): Promise<void> {
  const store = await readStore()
  const list = store[userId]
  if (!list?.length) return

  const entry = list.find((item) => item.bookingId === bookingId)
  if (!entry) return

  entry.lastSentAt = new Date().toISOString()
  await writeStore(store)
}

/** First nudge 30 min after pickup, then once per day until reviewed. */
export function shouldSendReviewReminder(entry: PendingReviewReminder): boolean {
  const now = Date.now()
  const registeredAt = Date.parse(entry.registeredAt)
  if (Number.isNaN(registeredAt)) return false

  if (!entry.lastSentAt) {
    return now - registeredAt >= FIRST_REMINDER_MS
  }

  const lastSentAt = Date.parse(entry.lastSentAt)
  if (Number.isNaN(lastSentAt)) {
    return now - registeredAt >= FIRST_REMINDER_MS
  }

  return now - lastSentAt >= REPEAT_REMINDER_MS
}
