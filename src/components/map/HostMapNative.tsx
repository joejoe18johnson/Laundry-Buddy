import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { HostPricePin, YouMarker } from './MapPins'
import { getMapRegion, USER_LOCATION } from '../../lib/mapRegion'
import type { Host } from '../../types'

interface Props {
  hosts: Host[]
  onHostPress: (host: Host) => void
}

/** Apple / Google maps via react-native-maps — works in Expo Go. */
export function HostMapNative({ hosts, onHostPress }: Props) {
  const region = useMemo(() => getMapRegion(hosts), [hosts])

  return (
    <View style={styles.wrap}>
      <MapView style={styles.map} initialRegion={region} pitchEnabled={false} rotateEnabled={false}>
        <Marker coordinate={USER_LOCATION} anchor={{ x: 0.5, y: 0.5 }}>
          <YouMarker />
        </Marker>
        {hosts.map((host) => (
          <Marker
            key={host.id}
            coordinate={{ latitude: host.latitude, longitude: host.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => onHostPress(host)}
          >
            <HostPricePin price={host.price} onPress={() => onHostPress(host)} />
          </Marker>
        ))}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { flex: 1 },
})
