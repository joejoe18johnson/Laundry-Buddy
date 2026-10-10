import { useEffect, useMemo, useRef } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { buildLeafletMapHtml, type MapHostPin } from '../../lib/leafletMapHtml'
import { SEARCH_RADIUS_KM } from '../../lib/geo'
import { colors } from '../../theme'
import type { HostMapProps } from '../HostMap'

function hostsToMapPins(
  hosts: HostMapProps['hosts'],
  nearbyHostIds: ReadonlySet<string>,
  listPriceFor: (host: HostMapProps['hosts'][number]) => number | null,
): MapHostPin[] {
  return hosts.map((h) => {
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
  })
}

/**
 * Interactive Positron map via MapLibre GL JS in a WebView.
 * Works in Expo Go, web, and as fallback — same OpenFreeMap style as native MapLibre.
 */
export function HostMapLeaflet({
  hosts,
  nearbyHostIds,
  onHostPress,
  userLocation,
  radiusKm = SEARCH_RADIUS_KM,
  fitToResults = false,
  fitToHosts,
  resolveListPrice,
}: HostMapProps) {
  const webRef = useRef<WebView>(null)
  const listPriceFor = resolveListPrice ?? ((host: { price: number }) => host.price)

  const mapKey = useMemo(
    () =>
      `${userLocation.latitude.toFixed(3)}-${userLocation.longitude.toFixed(3)}-${radiusKm}`,
    [radiusKm, userLocation.latitude, userLocation.longitude],
  )

  const hostPins = useMemo(
    () => hostsToMapPins(hosts, nearbyHostIds, listPriceFor),
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

  const fitPayload = useMemo(() => JSON.stringify(fitCoords), [fitCoords])

  useEffect(() => {
    webRef.current?.injectJavaScript(`
      if (window.__lbUpdateHosts) {
        window.__lbUpdateHosts(${hostsPayload}, ${fitPayload}, ${fitToResults ? 'true' : 'false'});
      }
      true;
    `)
  }, [fitPayload, fitToResults, hostsPayload])

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        key={mapKey}
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://laundry-buddy.local' }}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
        mixedContentMode="always"
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        onContentProcessDidTerminate={() => webRef.current?.reload()}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as { type?: string; hostId?: string }
            if (data.type === 'host' && data.hostId) {
              const host = hosts.find((h) => h.id === data.hostId)
              if (host) onHostPress(host)
            }
          } catch {
            // ignore malformed messages
          }
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.mapBg,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: colors.mapBg,
    opacity: 0.99,
  },
})
