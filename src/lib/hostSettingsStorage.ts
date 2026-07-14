import AsyncStorage from '@react-native-async-storage/async-storage'
import { SEED_HOST_SETTINGS, SEED_DATA_VERSION } from '../data/seedData'
import type { HostSettings, PaymentMethod } from '../types'

const SETTINGS_KEY = 'laundry-buddy-host-settings'
const VERSION_KEY = 'laundry-buddy-host-settings-version'

export const DEFAULT_HOST_SETTINGS: HostSettings = {
  isOnline: false,
  acceptCash: true,
  acceptBankTransfer: false,
  bankDetails: { bankName: '', accountName: '', accountNumber: '' },
  notifyNewRequests: true,
  notifyBookingUpdates: true,
  notifyGuestsWhenOnline: true,
}

async function seedIfNeeded(): Promise<Record<string, HostSettings>> {
  const storedVersion = await AsyncStorage.getItem(VERSION_KEY)
  if (storedVersion !== SEED_DATA_VERSION) {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(SEED_HOST_SETTINGS))
    await AsyncStorage.setItem(VERSION_KEY, SEED_DATA_VERSION)
    return SEED_HOST_SETTINGS
  }

  const raw = await AsyncStorage.getItem(SETTINGS_KEY)
  if (!raw) {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(SEED_HOST_SETTINGS))
    return SEED_HOST_SETTINGS
  }
  return JSON.parse(raw) as Record<string, HostSettings>
}

export async function getAllHostSettings(): Promise<Record<string, HostSettings>> {
  return seedIfNeeded()
}

export async function getHostSettings(userId: string): Promise<HostSettings> {
  const all = await seedIfNeeded()
  return all[userId] ?? { ...DEFAULT_HOST_SETTINGS }
}

export async function saveHostSettings(userId: string, settings: HostSettings): Promise<void> {
  const all = await seedIfNeeded()
  all[userId] = settings
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(all))
}

export function isHostOnline(
  hostUserId: string | undefined,
  settingsMap: Record<string, HostSettings>,
): boolean {
  if (!hostUserId) return false
  return settingsMap[hostUserId]?.isOnline ?? false
}

export function getHostPaymentMethods(settings: HostSettings): PaymentMethod[] {
  const methods: PaymentMethod[] = []
  if (settings.acceptCash) methods.push('cash')
  if (settings.acceptBankTransfer && settings.bankDetails.accountNumber.trim()) {
    methods.push('bank_transfer')
  }
  return methods
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
}
