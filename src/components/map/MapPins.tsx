import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme'

const CORE = 42
const HALO = 56

export function YouMarker() {
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.delay(600),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.45] })
  const opacity = pulse.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.4, 0.15, 0] })

  return (
    <View style={styles.youWrap}>
      <Animated.View style={[styles.youPulse, { transform: [{ scale }], opacity }]} />
      <View style={styles.youCore} />
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
  const pulse = useRef(new Animated.Value(0)).current
  const label = price <= 0 ? 'Free' : `$${price}`
  const isFree = price <= 0

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.delay(500),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] })
  const opacity = pulse.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.35, 0.12, 0] })

  return (
    <Pressable onPress={onPress} style={styles.wrap} hitSlop={6}>
      <Animated.View style={[styles.pulse, { transform: [{ scale }], opacity }]} />
      <View style={styles.core}>
        <Text style={[styles.pinText, isFree && styles.pinTextFree]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: HALO,
    height: HALO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: CORE,
    height: CORE,
    borderRadius: CORE / 2,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  core: {
    width: CORE,
    height: CORE,
    borderRadius: CORE / 2,
    backgroundColor: colors.black,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  pinText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  pinTextFree: { fontSize: 10, fontWeight: '800', letterSpacing: 0 },
  youWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  youPulse: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(39,110,241,0.35)',
  },
  youCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.blue,
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.blue,
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
})
