import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { BrandWasherIcon } from './BrandWasherIcon'

const SIZE = 220

export function SplashWasherAnimation() {
  const breathe = useRef(new Animated.Value(0)).current
  const fade = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    )

    const fadeIn = Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    })

    breatheLoop.start()
    fadeIn.start()

    return () => {
      breatheLoop.stop()
      fadeIn.stop()
    }
  }, [breathe, fade])

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] })

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
        <BrandWasherIcon size={SIZE} variant="app" />
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
})
