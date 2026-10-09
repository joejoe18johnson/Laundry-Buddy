import AsyncStorage from '@react-native-async-storage/async-storage'
import type { BookingDraft } from '../types'

const KEY = 'laundry-buddy-booking-draft'

export function normalizeBookingDraft(draft: BookingDraft): BookingDraft {
  return {
    ...draft,
    sheetsOption: draft.sheetsOption ?? 'own',
    laundryServiceMode: draft.laundryServiceMode ?? 'dry_only',
    detergentOption: draft.detergentOption ?? 'own',
    dryerSheetsPacks: draft.dryerSheetsPacks ?? 0,
  }
}

export async function loadStoredBookingDraft(userId: string): Promise<BookingDraft | null> {
  const raw = await AsyncStorage.getItem(KEY)
  if (!raw) return null
  try {
    const map = JSON.parse(raw) as Record<string, BookingDraft>
    const draft = map[userId]
    return draft?.hostId ? normalizeBookingDraft(draft) : null
  } catch {
    return null
  }
}

export async function saveStoredBookingDraft(userId: string, draft: BookingDraft | null): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY)
  const map = raw ? (JSON.parse(raw) as Record<string, BookingDraft>) : {}
  if (draft) {
    map[userId] = normalizeBookingDraft(draft)
  } else {
    delete map[userId]
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(map))
}
