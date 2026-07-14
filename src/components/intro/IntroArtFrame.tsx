import type { ReactNode } from 'react'
import Svg, { Circle } from 'react-native-svg'
import { colors } from '../../theme'

export function IntroArtFrame({
  children,
  size = 280,
  fill = colors.gray50,
}: {
  children: ReactNode
  size?: number
  fill?: string
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 280 280" fill="none">
      <Circle cx="140" cy="140" r="120" fill={fill} />
      <Circle cx="140" cy="140" r="120" stroke={colors.gray100} strokeWidth={1.5} />
      <Circle cx="140" cy="140" r="96" stroke={colors.gray100} strokeWidth={1} strokeDasharray="4 6" opacity={0.5} />
      {children}
    </Svg>
  )
}
