import type { Host } from '../types'

/** Stable key segment so map markers remount when published prices change. */
export function hostMarkerRenderKey(host: Host): string {
  return `${host.id}:${host.price}:${host.foldingPrice ?? 0}`
}

export function hostsMapRenderKey(hosts: readonly Host[]): string {
  return hosts.map(hostMarkerRenderKey).join('|')
}
