import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Camera, FillLayer, LineLayer, MapView, MarkerView, ShapeSource } from '@maplibre/maplibre-react-native'
import { HostPricePin, YouMarker } from './MapPins'
import { circleRing } from '../../lib/geo'
import {
  getMapRegionForRadius,
  OPENFREEMAP_STYLE_URL,
} from '../../lib/mapRegion'
import { SEARCH_RADIUS_KM } from '../../lib/geo'
import type { HostMapProps } from '../HostMap'

/** MapLibre + OpenFreeMap — free OSM vector maps (dev/production builds). */
export function HostMapLibre({
  hosts,
  onHostPress,
  userLocation,
  radiusKm = SEARCH_RADIUS_KM,
}: HostMapProps) {
  const region = useMemo(
    () => getMapRegionForRadius(userLocation, radiusKm),
    [userLocation, radiusKm],
  )
  void region
  const circleGeo = useMemo(
    () => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [circleRing(userLocation, radiusKm)],
      },
      properties: {},
    }),
    [userLocation, radiusKm],
  )

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
          defaultSettings={{
            centerCoordinate: [userLocation.longitude, userLocation.latitude],
            zoomLevel: 12,
          }}
        />
        <ShapeSource id="radius-circle" shape={circleGeo}>
          <FillLayer
            id="radius-fill"
            style={{ fillColor: '#000000', fillOpacity: 0.06 }}
          />
          <LineLayer
            id="radius-line"
            style={{
              lineColor: '#000000',
              lineWidth: 1.5,
              lineOpacity: 0.55,
              lineDasharray: [2, 2],
            }}
          />
        </ShapeSource>
        <MarkerView
          coordinate={[userLocation.longitude, userLocation.latitude]}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <YouMarker />
        </MarkerView>
        {hosts.map((host) => (
          <MarkerView
            key={host.id}
            coordinate={[host.longitude, host.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}
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
