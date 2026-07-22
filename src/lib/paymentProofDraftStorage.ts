import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'laundry-buddy-payment-proof-drafts'

async function readMap(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return {}
  }
}

export async function loadPaymentProofDraft(bookingId: string): Promise<string | null> {
  const map = await readMap()
  return map[bookingId] ?? null
}

export async function savePaymentProofDraft(bookingId: string, uri: string | null): Promise<void> {
  const map = await readMap()
  if (uri) {
    map[bookingId] = uri
  } else {
    delete map[bookingId]
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(map))
}
