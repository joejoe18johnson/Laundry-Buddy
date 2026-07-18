import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  DEMO_ANA_MARIA_BOOKING,
  SEED_DATA_VERSION,
} from '../data/seedData'
import { SEED_CHAT_THREADS } from '../data/seedMessages'
import { saveActiveBookings } from './bookingStorage'
import { saveHostOrders } from './hostOrdersStorage'

const SYNC_KEY = 'laundry-buddy-training-sync-version'
const MESSAGES_KEY = 'laundry-buddy-chat-messages'
const READ_KEY = 'laundry-buddy-chat-read'

/** Reset Ana ↔ Maria demo booking, host orders, and chat when seed version changes. */
export async function syncTrainingDemoIfNeeded(): Promise<void> {
  const stored = await AsyncStorage.getItem(SYNC_KEY)
  if (stored === SEED_DATA_VERSION) return

  await saveActiveBookings('user-ana', [DEMO_ANA_MARIA_BOOKING])
  await saveHostOrders('user-maria', {
    pendingRequests: [],
    activeLoads: [{ ...DEMO_ANA_MARIA_BOOKING }],
  })

  const raw = await AsyncStorage.getItem(MESSAGES_KEY)
  const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
  await AsyncStorage.setItem(
    MESSAGES_KEY,
    JSON.stringify({ ...existing, ...SEED_CHAT_THREADS }),
  )

  const readRaw = await AsyncStorage.getItem(READ_KEY)
  if (readRaw) {
    const readMap = JSON.parse(readRaw) as Record<string, Record<string, string>>
    for (const userId of ['user-ana', 'user-maria']) {
      if (readMap[userId]) {
        delete readMap[userId][DEMO_ANA_MARIA_BOOKING.id]
      }
    }
    await AsyncStorage.setItem(READ_KEY, JSON.stringify(readMap))
  }

  await AsyncStorage.setItem(SYNC_KEY, SEED_DATA_VERSION)
}
