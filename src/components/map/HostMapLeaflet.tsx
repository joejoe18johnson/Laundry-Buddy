import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { buildLeafletMapHtml } from '../../lib/leafletMapHtml'
import { colors } from '../../theme'
import type { Host } from '../../types'

interface Props {
  hosts: Host[]
  onHostPress: (host: Host) => void
}

/**
 * Interactive OpenStreetMap via Leaflet in a WebView.
 * Works in Expo Go, web, and simulators — no native map build required.
 */
export function HostMapLeaflet({ hosts, onHostPress }: Props) {
  const html = useMemo(() => buildLeafletMapHtml(hosts), [hosts])

  return (
    <View style={styles.wrap}>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://laundry-buddy.local' }}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
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
  },
})
