import { Pressable, StyleSheet, Text, View } from 'react-native'
import { WeatherBanner } from '../../components/WeatherBanner'
import { HostCard } from '../../components/HostCard'
import { Screen } from '../../components/ui'
import { getAvailableHosts, ACTIVE_REGION_LABEL } from '../../data/mockData'
import { useApp } from '../../context/AppContext'
import { colors, radius } from '../../theme'

export function HomeScreen() {
  const { showMap, setShowMap } = useApp()
  const hosts = getAvailableHosts()

  return (
    <Screen>
      <Text style={styles.title}>Find a dryer near you</Text>
      <Text style={styles.subtitle}>{hosts.length} hosts available in {ACTIVE_REGION_LABEL}</Text>
      <Text style={styles.regionHint}>Belmopan, Roaring Creek & nearby communities</Text>

      <WeatherBanner />

      <View style={styles.toolbar}>
        <Pressable style={styles.toolBtn}>
          <Text style={styles.toolText}>Filters</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={() => setShowMap(!showMap)}>
          <Text style={styles.toolText}>{showMap ? 'List' : 'Map'}</Text>
        </Pressable>
      </View>

      {showMap ? (
        <View style={styles.map}>
          {hosts.map((host, i) => (
            <View key={host.id} style={[styles.pin, pinPositions[i % 4]]}>
              <Text style={styles.pinName}>{host.name}</Text>
              <Text style={styles.pinDist}>{host.distanceKm} km</Text>
            </View>
          ))}
        </View>
      ) : (
        hosts.map((host) => <HostCard key={host.id} host={host} />)
      )}
    </Screen>
  )
}

const pinPositions = [
  { top: '25%' as const, left: '20%' as const },
  { top: '45%' as const, right: '18%' as const },
  { top: '60%' as const, left: '30%' as const },
  { top: '35%' as const, right: '35%' as const },
]

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 15, color: colors.gray500, marginBottom: 4 },
  regionHint: { fontSize: 13, color: colors.gray400, marginBottom: 16 },
  toolbar: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  toolBtn: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toolText: { fontSize: 13, fontWeight: '600' },
  map: {
    height: 320,
    backgroundColor: colors.gray50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    position: 'relative',
  },
  pin: {
    position: 'absolute',
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pinName: { fontSize: 13, fontWeight: '600' },
  pinDist: { fontSize: 11, color: colors.gray500 },
})
