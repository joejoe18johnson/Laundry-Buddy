import type { Host, HostSettings, LaundryServiceMode } from '../types'
import { hostListPriceForService } from './hostPricing'

/** Stable key segment so map markers remount when published prices or service filter change. */
export function hostMarkerRenderKey(
  host: Host,
  serviceFilter: LaundryServiceMode,
  listPrice: number | null,
): string {
  return `${host.id}:${serviceFilter}:${listPrice ?? 'na'}:${host.washPrice ?? host.price}:${host.dryPrice ?? 0}:${host.foldingPrice ?? 0}`
}

export function hostsMapRenderKey(
  hosts: readonly Host[],
  serviceFilter: LaundryServiceMode,
  resolveListPrice: (host: Host) => number | null,
): string {
  return hosts.map((host) => hostMarkerRenderKey(host, serviceFilter, resolveListPrice(host))).join('|')
}

export function resolveHostMapListPrice(
  host: Host,
  serviceFilter: LaundryServiceMode,
  getSettings?: (hostUserId?: string) => HostSettings | undefined,
): number | null {
  return hostListPriceForService(host, serviceFilter, getSettings?.(host.hostUserId))
}
