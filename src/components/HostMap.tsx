import Constants from 'expo-constants'
import { Component, type ReactNode } from 'react'
import { NativeModules, Platform } from 'react-native'
import { HostMapLibre } from './map/HostMapLibre'
import { HostMapNative } from './map/HostMapNative'
import { HostMapSample } from './map/HostMapSample'
import type { Host } from '../types'

export interface HostMapProps {
  hosts: Host[]
  onHostPress: (host: Host) => void
}

type MapBackend = 'maplibre' | 'native' | 'sample'

function resolveMapBackend(): MapBackend {
  if (Platform.OS === 'web') return 'sample'
  if (NativeModules.MLRNModule != null) return 'maplibre'
  if (Constants.appOwnership === 'expo' && (Platform.OS === 'ios' || Platform.OS === 'android')) {
    return 'native'
  }
  return 'sample'
}

interface State {
  backend: MapBackend
  failed: boolean
}

/** Catches native map crashes and falls back to the sample map. */
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
 * Home map — MapLibre + OpenFreeMap when available (free OSM tiles),
 * Apple/Google via react-native-maps in Expo Go, sample map as fallback.
 */
export function HostMap(props: HostMapProps) {
  const backend = resolveMapBackend()
  const sample = <HostMapSample {...props} />

  if (backend === 'sample') return sample

  const map =
    backend === 'maplibre' ? <HostMapLibre {...props} /> : <HostMapNative {...props} />

  return <MapErrorBoundary fallback={sample}>{map}</MapErrorBoundary>
}
