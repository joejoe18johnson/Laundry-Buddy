import { Circle, Path, Rect } from 'react-native-svg'
import { colors } from '../../theme'
import { IntroArtFrame } from './IntroArtFrame'

function Star({ cx, cy }: { cx: number; cy: number }) {
  return (
    <Path
      d={`M${cx} ${cy - 8} L${cx + 2.5} ${cy - 2} L${cx + 8} ${cy - 2} L${cx + 3.5} ${cy + 2} L${cx + 5.5} ${cy + 8} L${cx} ${cy + 4.5} L${cx - 5.5} ${cy + 8} L${cx - 3.5} ${cy + 2} L${cx - 8} ${cy - 2} L${cx - 2.5} ${cy - 2} Z`}
      fill={colors.black}
    />
  )
}

/** Slide 2 — verified hosts & ratings */
export function IntroArtTrusted({ size = 280 }: { size?: number }) {
  return (
    <IntroArtFrame size={size}>
      <Circle cx="140" cy="108" r="36" fill={colors.white} stroke={colors.black} strokeWidth={2.5} />
      <Path
        d="M140 148 C108 148 88 168 88 188 L88 210 L192 210 L192 188 C192 168 172 148 140 148 Z"
        fill={colors.white}
        stroke={colors.black}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Circle cx="108" cy="178" r="22" fill={colors.white} stroke={colors.black} strokeWidth={2} />
      <Circle cx="172" cy="178" r="22" fill={colors.white} stroke={colors.black} strokeWidth={2} />
      <Rect x="118" y="228" width="44" height="28" rx={8} fill={colors.black} />
      <Path
        d="M128 242 L136 250 L154 232"
        stroke={colors.white}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Star cx={108} cy={56} />
      <Star cx={140} cy={48} />
      <Star cx={172} cy={56} />
      <Star cx={124} cy={68} />
      <Star cx={156} cy={68} />
    </IntroArtFrame>
  )
}
