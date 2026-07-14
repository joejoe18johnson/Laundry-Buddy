import { useMemo, useState } from 'react'
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SampleMapArt } from './SampleMapArt'
import {
  buildSampleMapUrl,
  getMapRegion,
  projectCoordinate,
  USER_LOCATION,
} from '../lib/mapRegion'
import { colors, radius, spacing } from '../theme'
import type { Host } from '../types'

interface HostMapProps {
  hosts: Host[]
  onHostPress: (host: Host) => void
}

function MapMarker({
  label,
  onPress,
  variant = 'host',
}: {
  label: string
  onPress?: () => void
  variant?: 'host' | 'you'
}) {
  if (variant === 'you') {
    return (
      <View style={styles.youDot}>
        <View style={styles.youInner} />
      </View>
    )
  }

  return (
    <Pressable onPress={onPress} style={styles.pin}>
      <Text style={styles.pinText}>{label}</Text>
    </Pressable>
  )
}

/**
 * Sample map for testing — bundled SVG artwork with optional live OSM snapshot.
 * Avoids native map modules so it works in Expo Go, web, and simulators.
 */
export function HostMap({ hosts, onHostPress }: HostMapProps) {
  const region = useMemo(() => getMapRegion(hosts), [hosts])
  const [mapSize, setMapSize] = useState({ width: 800, height: 800 })
  const [remoteFailed, setRemoteFailed] = useState(false)

  const remoteUri = buildSampleMapUrl(region, mapSize.width, mapSize.height)
  const showRemote = !remoteFailed

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    if (width > 0 && height > 0) {
      setMapSize({
        width: Math.min(1024, Math.ceil(width * 2)),
        height: Math.min(1024, Math.ceil(height * 2)),
      })
    }
  }

  const youPos = projectCoordinate(USER_LOCATION.latitude, USER_LOCATION.longitude, region)

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <View style={styles.canvas}>
        <View style={StyleSheet.absoluteFill}>
          <SampleMapArt />
        </View>
        {showRemote && (
          <Image
            source={{ uri: remoteUri }}
            style={styles.remoteMap}
            resizeMode="cover"
            onError={() => setRemoteFailed(true)}
          />
        )}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View
            style={[
              styles.markerLayer,
              { left: `${youPos.x * 100}%`, top: `${youPos.y * 100}%` },
            ]}
          >
            <MapMarker label="" variant="you" />
          </View>
          {hosts.map((host) => {
            const pos = projectCoordinate(host.latitude, host.longitude, region)
            return (
              <View
                key={host.id}
                style={[
                  styles.markerLayer,
                  { left: `${pos.x * 100}%`, top: `${pos.y * 100}%` },
                ]}
              >
                <MapMarker
                  label={host.price <= 0 ? 'Free' : `$${host.price}`}
                  onPress={() => onHostPress(host)}
                />
              </View>
            )
          })}
        </View>
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Sample map · Cayo Area</Text>
        {!showRemote && <Text style={styles.legendSub}>Offline preview</Text>}
      </View>
      <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.mapBg },
  canvas: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.mapBg,
  },
  remoteMap: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.92,
  },
  markerLayer: {
    position: 'absolute',
    transform: [{ translateX: -20 }, { translateY: -28 }],
  },
  youDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(39, 110, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  youInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: colors.white,
  },
  pin: {
    backgroundColor: colors.black,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  pinText: { fontSize: 12, fontWeight: '700', color: colors.white },
  legend: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  legendText: { fontSize: 11, fontWeight: '700', color: colors.black },
  legendSub: { fontSize: 10, color: colors.gray500, marginTop: 1 },
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
})
