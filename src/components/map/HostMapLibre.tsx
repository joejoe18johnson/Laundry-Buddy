import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Camera, FillLayer, LineLayer, MapView, MarkerView, ShapeSource } from '@maplibre/maplibre-react-native'
import { HostPricePin, YouMarker } from './MapPins'
import { circleRing } from '../../lib/geo'
import { zoomLevelForRadiusKm, OPENFREEMAP_STYLE_URL } from '../../lib/mapRegion'
import { SEARCH_RADIUS_KM } from '../../lib/geo'
import type { HostMapProps } from '../HostMap'

/** MapLibre + OpenFreeMap Positron — light gray map (native builds). */
export function HostMapLibre({
  hosts,
  nearbyHostIds,
  onHostPress,
  userLocation,
  radiusKm = SEARCH_RADIUS_KM,
}: HostMapProps) {
  const zoomLevel = useMemo(() => zoomLevelForRadiusKm(radiusKm), [radiusKm])
  const cameraKey = `${userLocation.latitude.toFixed(4)}-${userLocation.longitude.toFixed(4)}-${radiusKm}`

  const sortedHosts = useMemo(
    () =>
      [...hosts].sort((a, b) => {
        const aNear = nearbyHostIds.has(a.id) ? 1 : 0
        const bNear = nearbyHostIds.has(b.id) ? 1 : 0
        return aNear - bNear
      }),
    [hosts, nearbyHostIds],
  )

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
          key={cameraKey}
          centerCoordinate={[userLocation.longitude, userLocation.latitude]}
          zoomLevel={zoomLevel}
          animationDuration={400}
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
        {sortedHosts.map((host) => (
          <MarkerView
            key={host.id}
            coordinate={[host.longitude, host.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <HostPricePin
              price={host.price}
              inRadius={nearbyHostIds.has(host.id)}
              onPress={() => onHostPress(host)}
            />
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
