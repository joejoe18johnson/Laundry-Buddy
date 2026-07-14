import { Circle, Path, Rect } from 'react-native-svg'
import { colors } from '../../theme'
import { IntroArtFrame } from './IntroArtFrame'

/** Slide 3 — hosts earn from their dryer at home */
export function IntroArtEarn({ size = 280 }: { size?: number }) {
  return (
    <IntroArtFrame size={size} fill={colors.greenBg}>
      <Rect x="56" y="88" width="168" height="120" rx="16" fill={colors.white} stroke={colors.black} strokeWidth={2.5} />
      <Rect x="76" y="108" width="56" height="56" rx="28" fill={colors.gray50} stroke={colors.black} strokeWidth={2} />
      <Circle cx="104" cy="136" r="18" fill="none" stroke={colors.black} strokeWidth={2} />
      <Path d="M104 118 L104 154 M86 136 L122 136" stroke={colors.black} strokeWidth={2} strokeLinecap="round" />
      <Rect x="148" y="112" width="56" height="12" rx={6} fill={colors.gray100} />
      <Rect x="148" y="132" width="44" height="12" rx={6} fill={colors.gray100} />
      <Rect x="148" y="152" width="52" height="12" rx={6} fill={colors.greenBg} stroke={colors.green} strokeWidth={1.5} />
      <Rect x="188" y="52" width="52" height="32" rx={10} fill={colors.black} />
      <Path
        d="M200 62 H228 M204 68 H224 M208 74 H220"
        stroke={colors.white}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx="68" cy="72" r="20" fill={colors.black} />
      <Path
        d="M62 72 H74 M68 66 V78"
        stroke={colors.white}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Rect x="72" y="218" width="136" height="36" rx={12} fill={colors.black} />
      <Path
        d="M92 236 H188"
        stroke={colors.white}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M108 230 L116 242 L132 228"
        stroke={colors.green}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </IntroArtFrame>
  )
}
