import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import { LocationPreferencesCard } from './LocationPreferencesCard'
import type { RadiusOptionKm } from '../lib/locationPreferences'
import { colors, spacing } from '../theme'

type Props = {
  visible: boolean
  locationLabel: string
  radiusKm: number
  locating: boolean
  onClose: () => void
  onUseGps: () => void
  onSelectArea: (area: string) => void
  onSelectRadius: (km: RadiusOptionKm) => void
}

export function LocationSettingsSheet({
  visible,
  locationLabel,
  radiusKm,
  locating,
  onClose,
  onUseGps,
  onSelectArea,
  onSelectRadius,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <AppIcon name="x" size={22} color={colors.black} />
          </Pressable>
          <Text style={styles.title}>Location Settings</Text>
          <View style={styles.closeBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LocationPreferencesCard
            variant="screen"
            locationLabel={locationLabel}
            radiusKm={radiusKm}
            locating={locating}
            onUseGps={onUseGps}
            onSelectArea={onSelectArea}
            onSelectRadius={onSelectRadius}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.black,
  },
  scroll: { flex: 1 },
  content: {
    padding: spacing.screen,
    paddingBottom: spacing.xxl,
  },
})
