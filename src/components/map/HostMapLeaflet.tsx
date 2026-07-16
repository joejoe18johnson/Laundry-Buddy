import { useMemo, useRef } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { buildLeafletMapHtml } from '../../lib/leafletMapHtml'
import { SEARCH_RADIUS_KM } from '../../lib/geo'
import { colors } from '../../theme'
import type { HostMapProps } from '../HostMap'

/**
 * Interactive OpenStreetMap via Leaflet in a WebView.
 * Works in Expo Go, web, and simulators — no native map build required.
 */
export function HostMapLeaflet({ hosts, onHostPress, userLocation, radiusKm = SEARCH_RADIUS_KM, fitToResults = false }: HostMapProps) {
  const webRef = useRef<WebView>(null)
  const html = useMemo(
    () => buildLeafletMapHtml(hosts, userLocation, radiusKm, fitToResults),
    [hosts, userLocation, radiusKm, fitToResults],
  )

  const mapKey = `${userLocation.latitude.toFixed(3)}-${userLocation.longitude.toFixed(3)}-${radiusKm}-${fitToResults ? 'fit' : 'radius'}`

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
