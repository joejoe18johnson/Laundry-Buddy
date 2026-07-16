import { Component, type ReactNode } from 'react'
import Constants from 'expo-constants'
import { NativeModules } from 'react-native'
import { HostMapLeaflet } from './map/HostMapLeaflet'
import type { Host } from '../types'

export interface HostMapProps {
  hosts: Host[]
  onHostPress: (host: Host) => void
  userLocation: { latitude: number; longitude: number }
  radiusKm?: number
  fitToResults?: boolean
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
  const isExpoGo = Constants.appOwnership === 'expo'

  if (!hasMapLibre || isExpoGo) return leaflet

  // Lazy-load MapLibre so Expo Go (no native module) never imports it.
  const { HostMapLibre } = require('./map/HostMapLibre') as typeof import('./map/HostMapLibre')

  return (
    <MapErrorBoundary fallback={leaflet}>
      <HostMapLibre {...props} />
    </MapErrorBoundary>
  )
}
