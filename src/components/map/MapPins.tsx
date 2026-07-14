import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme'

export function YouMarker() {
  return (
    <View style={styles.youDot}>
      <View style={styles.youInner} />
    </View>
  )
}

export function HostPricePin({
  price,
  onPress,
}: {
  price: number
  onPress?: () => void
}) {
  const label = price <= 0 ? 'Free' : `$${price}`
  return (
    <Pressable onPress={onPress} style={styles.pin}>
      <Text style={[styles.pinText, price <= 0 && styles.pinTextFree]}>{label}</Text>
    </Pressable>
  )
}

const PIN_SIZE = 38

const styles = StyleSheet.create({
  youDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(39, 110, 241, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  youInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.blue,
    borderWidth: 2.5,
    borderColor: colors.white,
  },
  pin: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: colors.black,
    borderWidth: 2.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinText: { fontSize: 11, fontWeight: '700', color: colors.white, textAlign: 'center' },
  pinTextFree: { fontSize: 9, fontWeight: '800' },
})
