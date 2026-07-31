import { useEffect, useMemo, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { radius, spacing } from '../theme'

type TypingIndicatorProps = {
  name?: string
}

function AnimatedDot({ delay, color }: { delay: number; color: string }) {
  const opacity = useRef(new Animated.Value(0.35)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 350, useNativeDriver: true }),
        Animated.delay(450 - delay),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [delay, opacity])

  return <Animated.View style={[styles.dot, { backgroundColor: color, opacity }]} />
}

export function TypingIndicator({ name }: TypingIndicatorProps) {
  const { colors } = useTheme()
  const label = useMemo(() => (name ? `${name} is typing` : 'Typing'), [name])

  return (
    <View style={styles.row} accessibilityLabel={label}>
      <View style={[styles.bubble, { backgroundColor: colors.gray100 }]}>
        <View style={styles.dots}>
          <AnimatedDot delay={0} color={colors.gray500} />
          <AnimatedDot delay={150} color={colors.gray500} />
          <AnimatedDot delay={300} color={colors.gray500} />
        </View>
      </View>
      {name ? <Text style={[styles.name, { color: colors.gray500 }]}>{name}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  name: {
    fontSize: 12,
    marginLeft: spacing.xs,
  },
})
