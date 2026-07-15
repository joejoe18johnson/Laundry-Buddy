import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg'
import { colors } from '../theme'

const SIZE = 220
const DOOR_CX = 110
const DOOR_CY = 162
const DOOR_R = 46

/** Dark navy ink from the reference illustration */
const INK = '#242C34'
const GREEN = colors.green
const STROKE = 2.6

function WasherFrame() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 220 220" fill="none">
      {/* Body */}
      <Rect x="48" y="36" width="124" height="158" rx="14" fill={colors.white} stroke={INK} strokeWidth={STROKE} />
      {/* Control panel divider */}
      <Line x1="58" y1="68" x2="162" y2="68" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      {/* Detergent drawer */}
      <Rect x="64" y="46" width="34" height="16" rx="8" fill={colors.white} stroke={INK} strokeWidth={STROKE} />
      {/* Dial */}
      <Circle cx="98" cy="54" r="11" fill={colors.white} stroke={INK} strokeWidth={STROKE} />
      {/* Green indicator (static base — animated overlay sits on top) */}
      <Rect x="82" y="51" width="10" height="3" rx="1.5" fill={GREEN} opacity={0.35} />
      {/* Settings lines */}
      <Line x1="138" y1="49" x2="154" y2="49" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1="138" y1="54" x2="154" y2="54" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1="138" y1="59" x2="154" y2="59" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      {/* Door rings */}
      <Circle
        cx={DOOR_CX}
        cy={DOOR_CY}
        r={DOOR_R + 5}
        fill={colors.white}
        stroke={INK}
        strokeWidth={STROKE}
      />
      <Circle
        cx={DOOR_CX}
        cy={DOOR_CY}
        r={DOOR_R}
        fill={colors.white}
        stroke={INK}
        strokeWidth={STROKE}
      />
      {/* Filter hatch */}
      <Rect x="134" y="168" width="24" height="16" rx="4" fill={colors.white} stroke={INK} strokeWidth={STROKE} />
      {/* Feet */}
      <Rect x="62" y="194" width="16" height="7" rx="2" fill={INK} />
      <Rect x="142" y="194" width="16" height="7" rx="2" fill={INK} />
    </Svg>
  )
}

/** Swirling drum strokes — green and ink curves from the reference art */
function DrumSwirl() {
  return (
    <Svg width={DOOR_R * 2} height={DOOR_R * 2} viewBox="0 0 92 92" fill="none">
      <Path
        d="M46 46 C46 28 62 24 68 38 C74 52 58 62 46 46Z"
        stroke={INK}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M46 46 C54 62 72 58 74 44 C76 30 58 28 46 46Z"
        stroke={GREEN}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M46 46 C28 50 24 66 38 72 C52 78 62 58 46 46Z"
        stroke={GREEN}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M46 46 C30 38 38 22 54 24 C70 26 66 42 46 46Z"
        stroke={INK}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M46 46 C62 38 78 46 76 60 C74 74 54 68 46 46Z"
        stroke={GREEN}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M46 46 C58 30 74 34 72 50 C70 66 50 64 46 46Z"
        stroke={INK}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  )
}

export function SplashWasherAnimation() {
  const spin = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0)).current
  const breathe = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    )

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

    spinLoop.start()
    pulseLoop.start()
    breatheLoop.start()

    return () => {
      spinLoop.stop()
      pulseLoop.stop()
      breatheLoop.stop()
    }
  }, [breathe, pulse, spin])

  const drumRotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  const indicatorOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] })
  const machineScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] })

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale: machineScale }] }}>
        <WasherFrame />

        <View style={styles.drumClip}>
          <Animated.View style={[styles.drumSpin, { transform: [{ rotate: drumRotate }] }]}>
            <DrumSwirl />
          </Animated.View>
        </View>

        <Animated.View style={[styles.indicator, { opacity: indicatorOpacity }]} />

        <Svg width={SIZE} height={SIZE} viewBox="0 0 220 220" style={styles.doorRing} pointerEvents="none">
          <Circle
            cx={DOOR_CX}
            cy={DOOR_CY}
            r={DOOR_R + 5}
            fill="none"
            stroke={INK}
            strokeWidth={STROKE}
          />
          <Circle cx={DOOR_CX} cy={DOOR_CY} r={DOOR_R} fill="none" stroke={INK} strokeWidth={STROKE} />
        </Svg>
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
  drumClip: {
    position: 'absolute',
    top: DOOR_CY - DOOR_R,
    left: DOOR_CX - DOOR_R,
    width: DOOR_R * 2,
    height: DOOR_R * 2,
    borderRadius: DOOR_R,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drumSpin: {
    width: DOOR_R * 2,
    height: DOOR_R * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 51,
    left: DOOR_CX - 28,
    width: 10,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: GREEN,
  },
  doorRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
})
