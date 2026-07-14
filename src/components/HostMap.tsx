import { Component, type ReactNode } from 'react'
import { NativeModules } from 'react-native'
import { HostMapLeaflet } from './map/HostMapLeaflet'
import { HostMapLibre } from './map/HostMapLibre'
import type { Host } from '../types'

export interface HostMapProps {
  hosts: Host[]
  onHostPress: (host: Host) => void
  userLocation: { latitude: number; longitude: number }
  radiusKm?: number
}

/** Catches native map crashes and falls back to Leaflet. */
class MapErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

/**
 * Home map — Leaflet + OpenStreetMap in Expo Go (default).
 * MapLibre + OpenFreeMap when a native dev build includes MapLibre.
 */
export function HostMap(props: HostMapProps) {
  const leaflet = <HostMapLeaflet {...props} />
  const hasMapLibre = NativeModules.MLRNModule != null

  if (!hasMapLibre) return leaflet

  return (
    <MapErrorBoundary fallback={leaflet}>
      <HostMapLibre {...props} />
    </MapErrorBoundary>
  )
}
