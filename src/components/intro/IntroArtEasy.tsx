import { Circle, Path, Rect } from 'react-native-svg'
import { colors } from '../../theme'
import { IntroArtFrame } from './IntroArtFrame'

/** Slide 1 — book on map in a few taps */
export function IntroArtEasy({ size = 280 }: { size?: number }) {
  return (
    <IntroArtFrame size={size}>
      <Rect x="72" y="48" width="136" height="184" rx="20" fill={colors.white} stroke={colors.black} strokeWidth={2.5} />
      <Rect x="88" y="68" width="104" height="72" rx="10" fill={colors.mapBg} stroke={colors.gray200} strokeWidth={1.5} />
      <Path
        d="M98 118 L118 98 L148 108 L178 88 L198 108"
        stroke={colors.gray200}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx="118" cy="98" r="8" fill={colors.black} />
      <Circle cx="148" cy="108" r="8" fill={colors.black} />
      <Circle cx="178" cy="88" r="8" fill={colors.black} />
      <Rect x="88" y="152" width="72" height="14" rx={7} fill={colors.black} />
      <Rect x="88" y="174" width="104" height="10" rx={5} fill={colors.gray100} />
      <Rect x="88" y="192" width="88" height="10" rx={5} fill={colors.gray100} />
      <Rect x="88" y="210" width="104" height="28" rx={14} fill={colors.black} />
      <Circle cx="218" cy="72" r="22" fill={colors.greenBg} stroke={colors.green} strokeWidth={2} />
      <Path
        d="M210 72 L216 78 L228 66"
        stroke={colors.green}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IntroArtFrame>
  )
}
