import { Pressable, StyleSheet, Text, View } from 'react-native'
import MapView, { Marker, UrlTile } from 'react-native-maps'
import { getMapRegion, OSM_TILE_URL, USER_LOCATION } from '../lib/mapRegion'
import { colors, radius } from '../theme'
import type { Host } from '../types'

interface HostMapProps {
  hosts: Host[]
  onHostPress: (host: Host) => void
}

function PricePin({ price, onPress }: { price: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.pin}>
      <Text style={styles.pinText}>{price <= 0 ? 'Free' : `$${price}`}</Text>
    </Pressable>
  )
}

export function HostMap({ hosts, onHostPress }: HostMapProps) {
  const region = getMapRegion(hosts)

  return (
    <View style={styles.wrap}>
      <MapView
        style={styles.map}
        initialRegion={region}
        mapType="none"
        showsUserLocation={false}
        showsMyLocationButton={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} flipY={false} />
        <Marker coordinate={USER_LOCATION} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.youDot}>
            <View style={styles.youInner} />
          </View>
        </Marker>
        {hosts.map((host) => (
          <Marker
            key={host.id}
            coordinate={{ latitude: host.latitude, longitude: host.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => onHostPress(host)}
          >
            <PricePin price={host.price} onPress={() => onHostPress(host)} />
          </Marker>
        ))}
      </MapView>
      <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
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
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pinText: { fontSize: 12, fontWeight: '700', color: colors.white },
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
    overflow: 'hidden',
  },
})
