import { useEffect, useMemo, useRef } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { buildLeafletMapHtml } from '../../lib/leafletMapHtml'
import { SEARCH_RADIUS_KM } from '../../lib/geo'
import { colors } from '../../theme'
import type { HostMapProps } from '../HostMap'

/**
 * Interactive Positron map via Leaflet in a WebView.
 * Works in Expo Go, web, and simulators — matches MapLibre Positron styling.
 */
export function HostMapLeaflet({
  hosts,
  nearbyHostIds,
  onHostPress,
  userLocation,
  radiusKm = SEARCH_RADIUS_KM,
  fitToResults = false,
  fitToHosts,
}: HostMapProps) {
  const webRef = useRef<WebView>(null)

  const mapKey = useMemo(
    () =>
      `${userLocation.latitude.toFixed(3)}-${userLocation.longitude.toFixed(3)}-${radiusKm}`,
    [radiusKm, userLocation.latitude, userLocation.longitude],
  )

  // Rebuild the WebView only when search center/radius changes — host pin updates go via injectJavaScript.
  const html = useMemo(
    () => buildLeafletMapHtml(hosts, nearbyHostIds, userLocation, radiusKm, fitToResults, fitToHosts),
    [mapKey, fitToResults],
  )

  const hostsPayload = useMemo(
    () =>
      JSON.stringify(
        hosts.map((h) => ({
          id: h.id,
          lat: h.latitude,
          lng: h.longitude,
          price: h.price,
          name: h.name,
          inRadius: nearbyHostIds.has(h.id),
        })),
      ),
    [hosts, nearbyHostIds],
  )

  const fitPayload = useMemo(
    () =>
      JSON.stringify(
        (fitToHosts ?? hosts).map((h) => ({ lat: h.latitude, lng: h.longitude })),
      ),
    [fitToHosts, hosts],
  )

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
