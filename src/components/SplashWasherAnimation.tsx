import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg'
import { colors } from '../theme'

const SIZE = 220

function WasherSvg() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 220 220" fill="none">
      <Ellipse cx="110" cy="198" rx="52" ry="6" fill="rgba(0,0,0,0.08)" />

      <Rect x="52" y="58" width="116" height="132" rx="18" fill={colors.white} stroke={colors.black} strokeWidth={2.5} />
      <Rect x="62" y="68" width="96" height="18" rx="6" fill={colors.gray75} stroke={colors.black} strokeWidth={1.5} />
      <Circle cx="82" cy="77" r="4" fill={colors.black} />
      <Circle cx="98" cy="77" r="4" fill={colors.black} />
      <Rect x="118" y="72" width="30" height="10" rx={5} fill={colors.gray200} />

      <Circle cx="110" cy="132" r="38" fill={colors.gray50} stroke={colors.black} strokeWidth={2.5} />
      <Circle cx="110" cy="132" r="30" fill={colors.mapBg} stroke={colors.gray200} strokeWidth={1.5} />
      <Path
        d="M110 108 C122 116 122 148 110 156 C98 148 98 116 110 108Z"
        fill={colors.gray100}
        stroke={colors.gray200}
        strokeWidth={1}
      />

      <Rect x="68" y="182" width="14" height="8" rx={3} fill={colors.black} />
      <Rect x="138" y="182" width="14" height="8" rx={3} fill={colors.black} />
    </Svg>
  )
}

function ShirtSvg() {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <Path
        d="M18 6 L24 10 L28 8 L30 14 L26 16 L26 30 L10 30 L10 16 L6 14 L8 8 L12 10 Z"
        fill={colors.black}
      />
      <Path d="M14 16 H22" stroke={colors.white} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}

function SockSvg() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Path
        d="M10 4 H18 C20 4 21 6 21 8 V14 C21 18 18 20 14 22 L8 24 C6 24 5 22 6 20 L10 14 V4Z"
        fill={colors.gray500}
      />
    </Svg>
  )
}

export function SplashWasherAnimation() {
  const bounce = useRef(new Animated.Value(0)).current
  const shirtX = useRef(new Animated.Value(0)).current
  const shirtY = useRef(new Animated.Value(0)).current
  const shirtRot = useRef(new Animated.Value(0)).current
  const shirtOpacity = useRef(new Animated.Value(0)).current
  const sockX = useRef(new Animated.Value(0)).current
  const sockY = useRef(new Animated.Value(0)).current
  const sockRot = useRef(new Animated.Value(0)).current
  const sockOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 520,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )

    const throwItem = (
      x: Animated.Value,
      y: Animated.Value,
      rot: Animated.Value,
      opacity: Animated.Value,
      delay: number,
    ) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
            Animated.timing(x, {
              toValue: 1,
              duration: 680,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(y, {
              toValue: 1,
              duration: 680,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(rot, {
              toValue: 1,
              duration: 680,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(y, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(rot, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
          Animated.delay(420),
        ]),
      )

    const shirtLoop = throwItem(shirtX, shirtY, shirtRot, shirtOpacity, 0)
    const sockLoop = throwItem(sockX, sockY, sockRot, sockOpacity, 340)

    bounceLoop.start()
    shirtLoop.start()
    sockLoop.start()

    return () => {
      bounceLoop.stop()
      shirtLoop.stop()
      sockLoop.stop()
    }
  }, [bounce, shirtOpacity, shirtRot, shirtX, shirtY, sockOpacity, sockRot, sockX, sockY])

  const washerTranslateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -10] })
  const washerScale = bounce.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.02, 1] })

  const shirtTranslateX = shirtX.interpolate({ inputRange: [0, 1], outputRange: [72, 0] })
  const shirtTranslateY = shirtY.interpolate({ inputRange: [0, 0.45, 1], outputRange: [-28, -52, 8] })
  const shirtRotate = shirtRot.interpolate({ inputRange: [0, 1], outputRange: ['-35deg', '18deg'] })

  const sockTranslateX = sockX.interpolate({ inputRange: [0, 1], outputRange: [88, 6] })
  const sockTranslateY = sockY.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-40, -58, 12] })
  const sockRotate = sockRot.interpolate({ inputRange: [0, 1], outputRange: ['25deg', '-12deg'] })

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.laundry,
          styles.shirt,
          {
            opacity: shirtOpacity,
            transform: [
              { translateX: shirtTranslateX },
              { translateY: shirtTranslateY },
              { rotate: shirtRotate },
            ],
          },
        ]}
      >
        <ShirtSvg />
      </Animated.View>

      <Animated.View
        style={[
          styles.laundry,
          styles.sock,
          {
            opacity: sockOpacity,
            transform: [
              { translateX: sockTranslateX },
              { translateY: sockTranslateY },
              { rotate: sockRotate },
            ],
          },
        ]}
      >
        <SockSvg />
      </Animated.View>

      <Animated.View
        style={{
          transform: [{ translateY: washerTranslateY }, { scale: washerScale }],
        }}
      >
        <WasherSvg />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laundry: {
    position: 'absolute',
    zIndex: 2,
  },
  shirt: {
    top: 18,
    right: 28,
  },
  sock: {
    top: 8,
    right: 12,
  },
})
