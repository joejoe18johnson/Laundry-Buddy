import { StyleSheet, Text, View } from 'react-native'
import { createElement } from 'react'
import { getMapRegion, USER_LOCATION } from '../lib/mapRegion'
import { colors, spacing } from '../theme'
import type { Host } from '../types'

interface HostMapProps {
  hosts: Host[]
  onHostPress: (host: Host) => void
}

/** Web fallback — OpenStreetMap embed, no API key. */
export function HostMap({ hosts }: HostMapProps) {
  const region = getMapRegion(hosts)
  const latPad = region.latitudeDelta / 2
  const lngPad = region.longitudeDelta / 2
  const bbox = [
    region.longitude - lngPad,
    region.latitude - latPad,
    region.longitude + lngPad,
    region.latitude + latPad,
  ].join('%2C')
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${USER_LOCATION.latitude}%2C${USER_LOCATION.longitude}`

  return (
    <View style={styles.wrap}>
      {createElement('iframe', {
        title: 'Host map',
        src,
        style: styles.frame,
      })}
      <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
      {hosts.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No hosts to show — use the list below</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.mapBg },
  frame: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  } as object,
  attribution: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    fontSize: 9,
    color: colors.gray500,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  empty: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: spacing.md,
    borderRadius: 8,
  },
  emptyText: { fontSize: 13, color: colors.gray600, textAlign: 'center' },
})
