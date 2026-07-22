import { useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { Camera, CircleLayer, FillLayer, LineLayer, MapView, MarkerView, ShapeSource } from '@maplibre/maplibre-react-native'
import { HostPricePin } from './MapPins'
import { hostMarkerRenderKey } from '../../lib/mapMarkers'
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
  const cameraRef = useRef<ComponentRef<typeof Camera>>(null)
  const zoomLevel = useMemo(
    () => zoomLevelForRadiusKm(radiusKm, userLocation),
    [radiusKm, userLocation],
  )
  const recenterKey = `${userLocation.latitude.toFixed(4)}-${userLocation.longitude.toFixed(4)}-${radiusKm}`

  useEffect(() => {
    cameraRef.current?.setCamera({
      centerCoordinate: [userLocation.longitude, userLocation.latitude],
      zoomLevel,
      animationDuration: 400,
    })
  }, [recenterKey, userLocation.latitude, userLocation.longitude, zoomLevel])

  const userPointGeo = useMemo(
    () => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [userLocation.longitude, userLocation.latitude],
      },
      properties: {},
    }),
    [userLocation],
  )

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
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [userLocation.longitude, userLocation.latitude],
            zoomLevel,
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
        <ShapeSource id="user-location" shape={userPointGeo}>
          <CircleLayer
            id="user-halo"
            style={{
              circleRadius: 14,
              circleColor: 'rgba(39, 110, 241, 0.35)',
            }}
          />
          <CircleLayer
            id="user-core"
            style={{
              circleRadius: 7,
              circleColor: '#276ef1',
              circleStrokeWidth: 3,
              circleStrokeColor: '#ffffff',
            }}
          />
        </ShapeSource>
        {sortedHosts.map((host) => (
          <MarkerView
            key={hostMarkerRenderKey(host)}
            coordinate={[host.longitude, host.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <HostPricePin
              key={hostMarkerRenderKey(host)}
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
