import type { Host, HostBankDetails, HostSettings } from '../types'
import { getHostProfileDetails } from '../data/seedData'
import { DRYER_SHEETS_PRICE } from './hostPricing'
import { DEFAULT_HOST_SETTINGS, normalizeHostSettings } from './hostSettingsStorage'
import { defaultListingFromHost } from './hostListing'
import { BELIZE_BANKS } from './belizeBanks'

function hashHostId(id: string): number {
  return id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function demoBankDetails(host: Host): HostBankDetails {
  const seed = hashHostId(host.id)
  return {
    bankName: BELIZE_BANKS[seed % BELIZE_BANKS.length],
    accountName: host.name,
    accountNumber: String(1_000_000 + (seed % 9_000_000)),
  }
}

/** Settings shown to guests when a host has no saved preferences yet. */
export function defaultGuestFacingHostSettings(host: Host): HostSettings {
  const bio = getHostProfileDetails(host.id).bio
  return normalizeHostSettings(
    {
      ...DEFAULT_HOST_SETTINGS,
      isOnline: true,
      acceptCash: true,
      acceptBankTransfer: true,
      bankDetails: demoBankDetails(host),
      notifyNewRequests: true,
      notifyBookingUpdates: true,
      notifyGuestsWhenOnline: true,
      pricing: {
        dryPrice: host.price,
        foldingPrice: host.foldingPrice ?? 0,
        sheetsPrice: DRYER_SHEETS_PRICE,
      },
      listing: defaultListingFromHost(host, bio),
    },
    host,
  )
}

export function resolveGuestFacingHostSettings(
  hostUserId: string | undefined,
  settingsMap: Record<string, HostSettings>,
  host?: Host | null,
): HostSettings {
  if (!hostUserId) return { ...DEFAULT_HOST_SETTINGS }
  const stored = settingsMap[hostUserId]
  if (stored) return normalizeHostSettings(stored, host ?? undefined)
  if (host) return defaultGuestFacingHostSettings(host)
  return { ...DEFAULT_HOST_SETTINGS }
}
