import { Component, type ReactNode } from 'react'
import Constants from 'expo-constants'
import { NativeModules } from 'react-native'
import { HostMapLeaflet } from './map/HostMapLeaflet'
import type { Host } from '../types'

export interface HostMapProps {
  hosts: Host[]
  /** Host IDs within the guest search radius — shown prominently on the map. */
  nearbyHostIds: ReadonlySet<string>
  onHostPress: (host: Host) => void
  userLocation: { latitude: number; longitude: number }
  radiusKm?: number
  fitToResults?: boolean
  /** When set with fitToResults, map bounds fit these hosts (e.g. search matches). */
  fitToHosts?: Host[]
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
 * Home map — Positron light style everywhere.
 * Leaflet + Carto Positron in Expo Go; MapLibre + OpenFreeMap Positron in native builds.
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
