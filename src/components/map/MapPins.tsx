import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '../../theme'

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
  return (
    <Pressable onPress={onPress} style={styles.pin}>
      <Text style={styles.pinText}>{price <= 0 ? 'Free' : `$${price}`}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  youDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(39, 110, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  youInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: colors.white,
  },
  pin: {
    backgroundColor: colors.black,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  pinText: { fontSize: 12, fontWeight: '700', color: colors.white },
})
