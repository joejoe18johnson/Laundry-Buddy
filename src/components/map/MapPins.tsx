import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme'

const CORE = 42
const CORE_DISTANT = 34
const HALO = 56
const HALO_DISTANT = 44

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
  inRadius = true,
  onPress,
}: {
  price: number
  inRadius?: boolean
  onPress?: () => void
}) {
  const pulse = useRef(new Animated.Value(0)).current
  const whitePulse = useRef(new Animated.Value(0)).current
  const label = price <= 0 ? 'Free' : `$${price}`
  const isFree = price <= 0
  const coreSize = inRadius ? CORE : CORE_DISTANT
  const haloSize = inRadius ? HALO : HALO_DISTANT

  useEffect(() => {
    if (!inRadius) return
    const darkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.delay(500),
      ]),
    )
    const whiteLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(whitePulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.delay(400),
      ]),
    )
    darkLoop.start()
    whiteLoop.start()
    return () => {
      darkLoop.stop()
      whiteLoop.stop()
    }
  }, [inRadius, pulse, whitePulse])

  const darkScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] })
  const darkOpacity = pulse.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.35, 0.12, 0] })
  const whiteScale = whitePulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.65] })
  const whiteOpacity = whitePulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.55, 0.2, 0] })

  return (
    <Pressable
      onPress={onPress}
      style={[styles.wrap, { width: haloSize, height: haloSize, opacity: inRadius ? 1 : 0.72 }]}
      hitSlop={6}
    >
      {inRadius ? (
        <>
          <Animated.View
            style={[
              styles.whitePulse,
              {
                width: coreSize,
                height: coreSize,
                borderRadius: coreSize / 2,
                transform: [{ scale: whiteScale }],
                opacity: whiteOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulse,
              {
                width: coreSize,
                height: coreSize,
                borderRadius: coreSize / 2,
                transform: [{ scale: darkScale }],
                opacity: darkOpacity,
              },
            ]}
          />
        </>
      ) : null}
      <View
        style={[
          inRadius ? styles.core : styles.coreDistant,
          {
            width: coreSize,
            height: coreSize,
            borderRadius: coreSize / 2,
          },
        ]}
      >
        <Text
          style={[
            inRadius ? styles.pinText : styles.pinTextDistant,
            isFree && styles.pinTextFree,
            !inRadius && isFree && styles.pinTextFreeDistant,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  whitePulse: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  pulse: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  core: {
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  coreDistant: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  pinText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  pinTextDistant: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  pinTextFree: { fontSize: 10, fontWeight: '800', letterSpacing: 0 },
  pinTextFreeDistant: { fontSize: 9, fontWeight: '700', letterSpacing: 0 },
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
