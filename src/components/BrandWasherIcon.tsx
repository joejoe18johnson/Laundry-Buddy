import Svg, { Circle, Line, Path, Rect } from 'react-native-svg'
import { brand, colors } from '../theme'

const VIEW = 220
const DOOR_CX = 110
const DOOR_CY = 162
const DOOR_R = 46
const STROKE = 2.6

const DRUM_SWIRL = [
  { d: 'M46 46 C46 28 62 24 68 38 C74 52 58 62 46 46Z', green: false },
  { d: 'M46 46 C54 62 72 58 74 44 C76 30 58 28 46 46Z', green: true },
  { d: 'M46 46 C28 50 24 66 38 72 C52 78 62 58 46 46Z', green: true },
  { d: 'M46 46 C30 38 38 22 54 24 C70 26 66 42 46 46Z', green: false },
  { d: 'M46 46 C62 38 78 46 76 60 C74 74 54 68 46 46Z', green: true },
  { d: 'M46 46 C58 30 74 34 72 50 C70 66 50 64 46 46Z', green: false },
]

type Props = {
  size?: number
  /** light = ink on white (in-app). app = white/green on black (launcher preview). */
  variant?: 'light' | 'app'
}

export function BrandWasherIcon({ size = 220, variant = 'light' }: Props) {
  const ink = variant === 'app' ? colors.white : brand.ink
  const bodyFill = colors.white
  const drumOffsetX = DOOR_CX - DOOR_R
  const drumOffsetY = DOOR_CY - DOOR_R

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`} fill="none">
      {variant === 'app' ? (
        <Rect width={VIEW} height={VIEW} rx={44} fill={brand.iconBg} />
      ) : null}
      <Rect x="48" y="36" width="124" height="158" rx="14" fill={bodyFill} stroke={ink} strokeWidth={STROKE} />
      <Line x1="58" y1="68" x2="162" y2="68" stroke={ink} strokeWidth={STROKE} strokeLinecap="round" />
      <Rect x="64" y="46" width="34" height="16" rx="8" fill={bodyFill} stroke={ink} strokeWidth={STROKE} />
      <Circle cx="98" cy="54" r="11" fill={bodyFill} stroke={ink} strokeWidth={STROKE} />
      <Rect x="82" y="51" width="10" height="3" rx="1.5" fill={brand.green} />
      <Line x1="138" y1="49" x2="154" y2="49" stroke={ink} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1="138" y1="54" x2="154" y2="54" stroke={ink} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1="138" y1="59" x2="154" y2="59" stroke={ink} strokeWidth={STROKE} strokeLinecap="round" />
      <Circle cx={DOOR_CX} cy={DOOR_CY} r={DOOR_R + 5} fill={bodyFill} stroke={ink} strokeWidth={STROKE} />
      <Circle cx={DOOR_CX} cy={DOOR_CY} r={DOOR_R} fill={bodyFill} stroke={ink} strokeWidth={STROKE} />
      {DRUM_SWIRL.map((path) => (
        <Path
          key={path.d}
          d={path.d}
          stroke={path.green ? brand.green : ink}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          transform={`translate(${drumOffsetX} ${drumOffsetY})`}
        />
      ))}
      <Rect x="134" y="168" width="24" height="16" rx="4" fill={bodyFill} stroke={ink} strokeWidth={STROKE} />
      <Rect x="62" y="194" width="16" height="7" rx="2" fill={ink} />
      <Rect x="142" y="194" width="16" height="7" rx="2" fill={ink} />
    </Svg>
  )
}
