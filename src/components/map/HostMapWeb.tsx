import { createElement, useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { buildLeafletMapHtml, type MapHostPin } from '../../lib/leafletMapHtml'
import { SEARCH_RADIUS_KM } from '../../lib/geo'
import { useTheme } from '../../context/ThemeContext'
import type { HostMapProps } from '../HostMap'

/** Browser map — iframe with the same OpenFreeMap Positron HTML used in native WebView. */
export function HostMapWeb({
  hosts,
  nearbyHostIds,
  onHostPress,
  userLocation,
  radiusKm = SEARCH_RADIUS_KM,
  fitToResults = false,
  fitToHosts,
  resolveListPrice,
}: HostMapProps) {
  const { colors } = useTheme()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const listPriceFor = resolveListPrice ?? ((host: { price: number }) => host.price)

  const mapKey = useMemo(
    () =>
      `${userLocation.latitude.toFixed(3)}-${userLocation.longitude.toFixed(3)}-${radiusKm}`,
    [radiusKm, userLocation.latitude, userLocation.longitude],
  )

  const hostPins = useMemo<MapHostPin[]>(
    () =>
      hosts.map((h) => {
        const listPrice = listPriceFor(h)
        return {
          id: h.id,
          lat: h.latitude,
          lng: h.longitude,
          price: listPrice ?? 0,
          name: h.name,
          inRadius: nearbyHostIds.has(h.id),
          unavailable: listPrice == null,
        }
      }),
    [hosts, listPriceFor, nearbyHostIds],
  )

  const fitCoords = useMemo(
    () => (fitToHosts ?? hosts).map((h) => ({ lat: h.latitude, lng: h.longitude })),
    [fitToHosts, hosts],
  )

  const html = useMemo(
    () => buildLeafletMapHtml(hostPins, userLocation, radiusKm, fitToResults, fitCoords),
    [fitCoords, fitToResults, hostPins, radiusKm, userLocation],
  )

  const hostsPayload = useMemo(() => JSON.stringify(hostPins), [hostPins])

  const fitPayload = useMemo(
    () =>
      JSON.stringify(
        (fitToHosts ?? hosts).map((h) => ({ lat: h.latitude, lng: h.longitude })),
      ),
    [fitToHosts, hosts],
  )

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      try {
        const data = JSON.parse(String(event.data)) as { type?: string; hostId?: string }
        if (data.type === 'host' && data.hostId) {
          const host = hosts.find((h) => h.id === data.hostId)
          if (host) onHostPress(host)
        }
      } catch {
        // ignore malformed messages
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [hosts, onHostPress])

  useEffect(() => {
    const win = iframeRef.current?.contentWindow as
      | (Window & {
          __lbUpdateHosts?: (
            nextHosts: unknown,
            nextFitHosts: unknown,
            shouldFitResults: boolean,
          ) => void
        })
      | null
    if (!win?.__lbUpdateHosts) return
    win.__lbUpdateHosts(JSON.parse(hostsPayload), JSON.parse(fitPayload), fitToResults)
  }, [fitPayload, fitToResults, hostsPayload])

  return (
    <View style={[styles.wrap, { backgroundColor: colors.mapBg }]}>
      {createElement('iframe', {
        ref: iframeRef,
        key: mapKey,
        title: 'Host map',
        srcDoc: html,
        style: {
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          backgroundColor: colors.mapBg,
        },
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: 'hidden',
  },
})
