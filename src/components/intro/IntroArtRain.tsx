import { Circle, Ellipse, Path, Rect } from 'react-native-svg'
import { colors } from '../../theme'
import { IntroArtFrame } from './IntroArtFrame'

/** Slide 2 — dry laundry even when it's raining */
export function IntroArtRain({ size = 280 }: { size?: number }) {
  return (
    <IntroArtFrame size={size} fill="#eef4fb">
      <Path
        d="M48 92 C72 72 108 68 140 76 C172 84 208 72 232 88 L232 128 L48 128 Z"
        fill={colors.gray200}
        opacity={0.85}
      />
      <Path
        d="M56 76 C88 52 128 48 168 58 C200 66 224 58 240 72"
        fill="none"
        stroke={colors.gray400}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path d="M72 64 L76 76 M96 58 L100 70 M120 56 L124 68" stroke={colors.gray400} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M88 132 L84 152 M104 128 L100 148 M120 134 L116 154 M136 130 L132 150 M156 132 L152 152 M176 128 L172 148"
        stroke={colors.blue}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
      <Rect x="96" y="148" width="88" height="72" rx="8" fill={colors.white} stroke={colors.black} strokeWidth={2.5} />
      <Path d="M96 168 H184" stroke={colors.gray200} strokeWidth={1.5} />
      <Rect x="108" y="178" width="28" height="34" rx="4" fill={colors.mapBg} stroke={colors.black} strokeWidth={1.5} />
      <Path
        d="M148 182 C160 182 168 190 168 200 C168 212 160 218 148 218 C136 218 128 212 128 200 C128 190 136 182 148 182 Z"
        fill={colors.gray100}
        stroke={colors.black}
        strokeWidth={1.5}
      />
      <Circle cx="148" cy="200" r="10" fill="none" stroke={colors.black} strokeWidth={1.5} />
      <Rect x="168" y="186" width="12" height="20" rx="3" fill={colors.black} />
      <Ellipse cx="140" cy="228" rx="52" ry="8" fill={colors.gray100} />
      <Path
        d="M196 156 C208 148 222 152 228 164 C234 176 226 188 212 192"
        fill="none"
        stroke={colors.black}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M212 192 L212 210 M204 204 L220 204"
        stroke={colors.black}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx="228" cy="164" r="14" fill={colors.white} stroke={colors.black} strokeWidth={2} />
      <Path d="M222 164 H234 M228 158 V170" stroke={colors.black} strokeWidth={2} strokeLinecap="round" />
    </IntroArtFrame>
  )
}
