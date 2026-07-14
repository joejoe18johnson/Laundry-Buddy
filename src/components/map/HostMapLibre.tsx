import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Camera, MapView, MarkerView } from '@maplibre/maplibre-react-native'
import { HostPricePin, YouMarker } from './MapPins'
import {
  getMapRegion,
  OPENFREEMAP_STYLE_URL,
  regionToBounds,
  USER_LOCATION,
} from '../../lib/mapRegion'
import type { Host } from '../../types'

interface Props {
  hosts: Host[]
  onHostPress: (host: Host) => void
}

/** MapLibre + OpenFreeMap — free OSM vector maps (dev/production builds). */
export function HostMapLibre({ hosts, onHostPress }: Props) {
  const region = useMemo(() => getMapRegion(hosts), [hosts])
  const bounds = regionToBounds(region)

  return (
    <View style={styles.wrap}>
      <MapView
        style={styles.map}
        mapStyle={OPENFREEMAP_STYLE_URL}
        logoEnabled={false}
        attributionEnabled
        attributionPosition={{ bottom: 8, right: 8 }}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Camera
          defaultSettings={
            hosts.length > 0
              ? { bounds: { ne: bounds.ne, sw: bounds.sw } }
              : {
                  centerCoordinate: [USER_LOCATION.longitude, USER_LOCATION.latitude],
                  zoomLevel: 12,
                }
          }
        />
        <MarkerView coordinate={[USER_LOCATION.longitude, USER_LOCATION.latitude]} anchor={{ x: 0.5, y: 0.5 }}>
          <YouMarker />
        </MarkerView>
        {hosts.map((host) => (
          <MarkerView
            key={host.id}
            coordinate={[host.longitude, host.latitude]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <HostPricePin price={host.price} onPress={() => onHostPress(host)} />
          </MarkerView>
        ))}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { flex: 1 },
})
