import { useMemo, useState } from 'react'
import {
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SampleMapArt } from '../SampleMapArt'
import { HostPricePin, YouMarker } from './MapPins'
import {
  buildSampleMapUrl,
  getMapRegion,
  projectCoordinate,
  USER_LOCATION,
} from '../../lib/mapRegion'
import { colors, radius, spacing } from '../../theme'
import type { Host } from '../../types'

interface Props {
  hosts: Host[]
  onHostPress: (host: Host) => void
}

/** Offline sample map — fallback when native maps are unavailable. */
export function HostMapSample({ hosts, onHostPress }: Props) {
  const region = useMemo(() => getMapRegion(hosts), [hosts])
  const [mapSize, setMapSize] = useState({ width: 800, height: 800 })
  const [remoteFailed, setRemoteFailed] = useState(false)
  const remoteUri = buildSampleMapUrl(region, mapSize.width, mapSize.height)
  const youPos = projectCoordinate(USER_LOCATION.latitude, USER_LOCATION.longitude, region)

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    if (width > 0 && height > 0) {
      setMapSize({
        width: Math.min(1024, Math.ceil(width * 2)),
        height: Math.min(1024, Math.ceil(height * 2)),
      })
    }
  }

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <View style={styles.canvas}>
        <View style={StyleSheet.absoluteFill}>
          <SampleMapArt />
        </View>
        {!remoteFailed && (
          <Image
            source={{ uri: remoteUri }}
            style={styles.remoteMap}
            resizeMode="cover"
            onError={() => setRemoteFailed(true)}
          />
        )}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={[styles.markerLayer, { left: `${youPos.x * 100}%`, top: `${youPos.y * 100}%` }]}>
            <YouMarker />
          </View>
          {hosts.map((host) => {
            const pos = projectCoordinate(host.latitude, host.longitude, region)
            return (
              <View
                key={host.id}
                style={[styles.markerLayer, { left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }]}
              >
                <HostPricePin price={host.price} onPress={() => onHostPress(host)} />
              </View>
            )
          })}
        </View>
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Preview map · Cayo Area</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.mapBg },
  canvas: { flex: 1, overflow: 'hidden' },
  remoteMap: { ...StyleSheet.absoluteFillObject, opacity: 0.92 },
  markerLayer: {
    position: 'absolute',
    transform: [{ translateX: -28 }, { translateY: -28 }],
  },
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
})
