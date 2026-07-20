import { StyleSheet, Text, View } from 'react-native'
import Svg, { Ellipse, Line } from 'react-native-svg'
import { toTitleCase } from '../lib/titleCase'
import { colors, spacing } from '../theme'

type Props = {
  label?: string
  light?: boolean
}

export function SelfieFrameGuide({ label, light }: Props) {
  const stroke = light ? 'rgba(255,255,255,0.95)' : colors.black
  const dash = light ? 'rgba(255,255,255,0.45)' : colors.gray200
  const textColor = light ? colors.white : colors.gray600

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 240 300">
        <Ellipse
          cx="120"
          cy="128"
          rx="78"
          ry="98"
          stroke={stroke}
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="10 8"
        />
        <Line x1="24" y1="24" x2="54" y2="24" stroke={dash} strokeWidth="3" strokeLinecap="round" />
        <Line x1="24" y1="24" x2="24" y2="54" stroke={dash} strokeWidth="3" strokeLinecap="round" />
        <Line x1="216" y1="24" x2="186" y2="24" stroke={dash} strokeWidth="3" strokeLinecap="round" />
        <Line x1="216" y1="24" x2="216" y2="54" stroke={dash} strokeWidth="3" strokeLinecap="round" />
        <Line x1="24" y1="276" x2="54" y2="276" stroke={dash} strokeWidth="3" strokeLinecap="round" />
        <Line x1="24" y1="276" x2="24" y2="246" stroke={dash} strokeWidth="3" strokeLinecap="round" />
        <Line x1="216" y1="276" x2="186" y2="276" stroke={dash} strokeWidth="3" strokeLinecap="round" />
        <Line x1="216" y1="276" x2="216" y2="246" stroke={dash} strokeWidth="3" strokeLinecap="round" />
      </Svg>
      {label ? (
        <Text style={[styles.label, { color: textColor }]}>{toTitleCase(label)}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    bottom: spacing.lg,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
})
