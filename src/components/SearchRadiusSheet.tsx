import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import {
  formatRadiusMilesLabel,
  RADIUS_OPTIONS_MILES,
  type RadiusOptionMiles,
} from '../lib/locationPreferences'
import { toTitleCase } from '../lib/titleCase'
import { colors, radius, spacing } from '../theme'

type Props = {
  visible: boolean
  selectedMiles: RadiusOptionMiles
  onClose: () => void
  onSelect: (miles: RadiusOptionMiles) => void
}

export function SearchRadiusSheet({ visible, selectedMiles, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheetWrap} onPress={(event) => event.stopPropagation()}>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>{toTitleCase('Search radius')}</Text>
            <Text style={styles.sub}>
              {toTitleCase('Hosts within this distance appear in your list. Default is 1 mile.')}
            </Text>
            <View style={styles.options}>
              {RADIUS_OPTIONS_MILES.map((miles) => {
                const selected = miles === selectedMiles
                return (
                  <Pressable
                    key={miles}
                    onPress={() => {
                      onSelect(miles)
                      onClose()
                    }}
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {formatRadiusMilesLabel(miles)}
                    </Text>
                    {selected ? <AppIcon name="check" size={16} color={colors.white} /> : null}
                  </Pressable>
                )
              })}
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetWrap: { width: '100%' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.gray200,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
    textAlign: 'center',
  },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
  optionSelected: {
    borderColor: colors.black,
    backgroundColor: colors.black,
  },
  optionText: { fontSize: 16, fontWeight: '600', color: colors.black },
  optionTextSelected: { color: colors.white },
})
