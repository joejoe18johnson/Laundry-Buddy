import { useEffect, useRef, type ReactNode } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg'
import { colors } from '../theme'

const SIZE = 260
const DOOR_Y = 152
const DOOR_R = 40
const CYCLE_MS = 3200
const DROP_MS = 980

function ClothBlob({ fill }: { fill: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path
        d="M4 8 C4 4 8 2 11 4 C14 2 18 4 18 8 C18 14 11 19 11 19 C11 19 4 14 4 8 Z"
        fill={fill}
      />
    </Svg>
  )
}

function MiniShirt() {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Path
        d="M13 4 L17 7 L20 5 L22 10 L19 12 L19 22 H7 L7 12 L4 10 L6 5 L9 7 Z"
        fill={colors.black}
      />
    </Svg>
  )
}

function MiniSock() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path
        d="M7 3 H13 C15 3 16 5 16 7 V10 C16 13 13 14 10 16 L5 17 C4 17 3 16 4 14 L7 10 V3 Z"
        fill={colors.gray500}
      />
    </Svg>
  )
}

type FallingItemProps = {
  progress: Animated.AnimatedInterpolation<number>
  startX: number
  peakY: number
  endY: number
  endX: number
  rotStart: string
  rotEnd: string
  children: ReactNode
}

function FallingItem({
  progress,
  startX,
  peakY,
  endY,
  endX,
  rotStart,
  rotEnd,
  children,
}: FallingItemProps) {
  const translateX = progress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [startX, (startX + endX) / 2, endX],
  })
  const translateY = progress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [peakY, peakY - 38, endY],
  })
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [rotStart, rotEnd],
  })
  const opacity = progress.interpolate({
    inputRange: [0, 0.06, 0.7, 0.86, 1],
    outputRange: [0, 1, 1, 0.4, 0],
  })
  const scale = progress.interpolate({
    inputRange: [0, 0.7, 0.86, 1],
    outputRange: [1, 1, 0.5, 0.3],
  })

  return (
    <Animated.View
      style={[
        styles.falling,
        {
          opacity,
          transform: [{ translateX }, { translateY }, { rotate }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}

function DryerFrame() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 260 260" fill="none">
      <Ellipse cx="130" cy="232" rx="58" ry="7" fill="rgba(0,0,0,0.07)" />
      <Rect x="58" y="72" width="144" height="148" rx="22" fill={colors.white} stroke={colors.black} strokeWidth={2.5} />
      <Rect x="70" y="84" width="120" height="20" rx="7" fill={colors.gray75} stroke={colors.black} strokeWidth={1.5} />
      <Circle cx="92" cy="94" r="4.5" fill={colors.black} />
      <Circle cx="110" cy="94" r="4.5" fill={colors.black} />
      <Rect x="132" y="89" width="36" height="10" rx={5} fill={colors.gray200} />
      <Circle cx="130" cy={DOOR_Y} r={DOOR_R + 6} fill={colors.gray50} stroke={colors.black} strokeWidth={2.5} />
      <Circle cx="130" cy={DOOR_Y} r={DOOR_R} fill={colors.mapBg} stroke={colors.gray200} strokeWidth={1.5} />
      <Circle cx="130" cy={DOOR_Y} r={DOOR_R - 2} fill="rgba(255,255,255,0.28)" />
      <Rect x="76" y="206" width="16" height="9" rx={4} fill={colors.black} />
      <Rect x="168" y="206" width="16" height="9" rx={4} fill={colors.black} />
    </Svg>
  )
}

function DrumInterior({ spin }: { spin: Animated.AnimatedInterpolation<string> }) {
  return (
    <Animated.View style={[styles.drumSpin, { transform: [{ rotate: spin }] }]}>
      <Svg width={76} height={76} viewBox="0 0 76 76">
        <Circle cx="38" cy="38" r="36" fill={colors.gray100} />
        <Path d="M24 30 C30 24 46 24 52 30 L50 46 C38 52 26 46 24 30 Z" fill={colors.black} opacity={0.88} />
        <Path d="M28 40 C32 36 44 36 48 40 L46 50 C38 54 30 50 28 40 Z" fill={colors.gray500} opacity={0.92} />
        <Circle cx="42" cy="34" r="6.5" fill="#276ef1" opacity={0.88} />
        <Circle cx="32" cy="44" r="5.5" fill={colors.gray400} opacity={0.85} />
      </Svg>
    </Animated.View>
  )
}

function createDropLoop(value: Animated.Value, delayMs: number) {
  const pause = Math.max(0, CYCLE_MS - delayMs - DROP_MS)
  return Animated.loop(
    Animated.sequence([
      Animated.delay(delayMs),
      Animated.timing(value, {
        toValue: 1,
        duration: DROP_MS,
        easing: Easing.bezier(0.37, 0, 0.18, 1),
        useNativeDriver: true,
      }),
      Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(pause),
    ]),
  )
}

export function SplashDryerAnimation() {
  const drumSpin = useRef(new Animated.Value(0)).current
  const fillLevel = useRef(new Animated.Value(0)).current
  const drop1 = useRef(new Animated.Value(0)).current
  const drop2 = useRef(new Animated.Value(0)).current
  const drop3 = useRef(new Animated.Value(0)).current
  const drop4 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(drumSpin, {
        toValue: 1,
        duration: 5200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )

    const fillLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(fillLevel, {
          toValue: 1,
          duration: CYCLE_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(fillLevel, {
          toValue: 0.35,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )

    const loop1 = createDropLoop(drop1, 0)
    const loop2 = createDropLoop(drop2, 640)
    const loop3 = createDropLoop(drop3, 1280)
    const loop4 = createDropLoop(drop4, 1920)

    spinLoop.start()
    fillLoop.start()
    loop1.start()
    loop2.start()
    loop3.start()
    loop4.start()

    return () => {
      spinLoop.stop()
      fillLoop.stop()
      loop1.stop()
      loop2.stop()
      loop3.stop()
      loop4.stop()
    }
  }, [drumSpin, fillLevel, drop1, drop2, drop3, drop4])

  const spin = drumSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  const pileScale = fillLevel.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.05] })
  const pileOpacity = fillLevel.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0.55, 0.9, 1] })

  return (
    <View style={styles.wrap}>
      <DryerFrame />

      <View style={styles.drumClip}>
        <Animated.View style={[styles.pile, { opacity: pileOpacity, transform: [{ scale: pileScale }] }]}>
          <DrumInterior spin={spin} />
        </Animated.View>
      </View>

      <View style={styles.drops} pointerEvents="none">
        <FallingItem progress={drop1} startX={46} peakY={6} endY={88} endX={-8} rotStart="-30deg" rotEnd="14deg">
          <MiniShirt />
        </FallingItem>
        <FallingItem progress={drop2} startX={70} peakY={-2} endY={92} endX={10} rotStart="20deg" rotEnd="-10deg">
          <MiniSock />
        </FallingItem>
        <FallingItem progress={drop3} startX={22} peakY={10} endY={90} endX={-14} rotStart="-14deg" rotEnd="18deg">
          <ClothBlob fill="#276ef1" />
        </FallingItem>
        <FallingItem progress={drop4} startX={86} peakY={2} endY={86} endX={12} rotStart="24deg" rotEnd="-16deg">
          <ClothBlob fill={colors.gray400} />
        </FallingItem>
      </View>

      <Svg width={SIZE} height={SIZE} viewBox="0 0 260 260" style={styles.doorOverlay} pointerEvents="none">
        <Circle cx="130" cy={DOOR_Y} r={DOOR_R + 2} fill="none" stroke={colors.black} strokeWidth={2.5} />
        <Circle cx="130" cy={DOOR_Y} r={DOOR_R - 1} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
      </Svg>
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
    top: DOOR_Y - DOOR_R,
    left: SIZE / 2 - DOOR_R,
    width: DOOR_R * 2,
    height: DOOR_R * 2,
    borderRadius: DOOR_R,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drumSpin: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  drops: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  falling: {
    position: 'absolute',
    top: DOOR_Y - 24,
    left: SIZE / 2 - 13,
  },
  doorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
})
