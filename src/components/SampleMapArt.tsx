import { useState } from 'react'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg'
import { colors } from '../theme'

/** Bundled Positron-style map — light gray B&W, no network required. */
export function SampleMapArt() {
  const [size, setSize] = useState({ width: 400, height: 400 })

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    if (width > 0 && height > 0) setSize({ width, height })
  }

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <Svg width={size.width} height={size.height} viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
        <Rect width={400} height={400} fill={colors.mapBg} />
        <Path
          d="M-20 220 C80 180, 120 260, 200 240 S320 200, 420 230 L420 400 L-20 400 Z"
          fill={colors.gray100}
          opacity={0.85}
        />
        <Path
          d="M40 120 L360 80 L380 160 L320 220 L180 260 L60 200 Z"
          fill={colors.gray75}
          stroke={colors.gray200}
          strokeWidth={1}
        />
        <Path d="M0 180 L400 140" stroke={colors.white} strokeWidth={14} opacity={0.95} />
        <Path d="M0 180 L400 140" stroke={colors.gray200} strokeWidth={2} />
        <Path d="M120 0 L160 400" stroke={colors.white} strokeWidth={10} opacity={0.9} />
        <Path d="M120 0 L160 400" stroke={colors.gray200} strokeWidth={2} />
        <Path d="M280 0 L240 400" stroke={colors.white} strokeWidth={8} opacity={0.9} />
        <Path d="M280 0 L240 400" stroke={colors.gray200} strokeWidth={1.5} />
        <Path d="M0 300 Q200 270 400 320" stroke={colors.white} strokeWidth={8} opacity={0.85} />
        <Path d="M0 300 Q200 270 400 320" stroke={colors.gray200} strokeWidth={1.5} />
        <Rect x={48} y={88} width={72} height={48} rx={8} fill={colors.gray100} opacity={0.9} />
        <Rect x={260} y={200} width={88} height={56} rx={8} fill={colors.gray100} opacity={0.9} />
        <Rect x={180} y={300} width={64} height={40} rx={8} fill={colors.gray100} opacity={0.85} />
        <Circle
          cx={200}
          cy={200}
          r={120}
          fill="none"
          stroke={colors.gray200}
          strokeWidth={1}
          strokeDasharray="6 8"
          opacity={0.7}
        />
        <SvgText x={200} y={36} textAnchor="middle" fill={colors.gray500} fontSize={11} fontWeight="600">
          SAMPLE MAP · BELIZE
        </SvgText>
        <SvgText x={148} y={168} textAnchor="middle" fill={colors.gray600} fontSize={10} fontWeight="600">
          San Ignacio
        </SvgText>
        <SvgText x={248} y={148} textAnchor="middle" fill={colors.gray500} fontSize={9}>
          UB
        </SvgText>
        <SvgText x={92} y={248} textAnchor="middle" fill={colors.gray500} fontSize={9}>
          Las Flores
        </SvgText>
        <SvgText x={300} y={268} textAnchor="middle" fill={colors.gray500} fontSize={9}>
          Belmopan
        </SvgText>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, width: '100%', height: '100%' },
})
