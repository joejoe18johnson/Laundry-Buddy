import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg'
import { colors } from '../theme'

/** Bundled stylized map — always visible for testing, no network required. */
export function SampleMapArt() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
      <Rect width={400} height={400} fill="#e8efe4" />
      <Rect x={0} y={0} width={400} height={400} fill="#dce8f5" opacity={0.35} />
      <Path
        d="M-20 220 C80 180, 120 260, 200 240 S320 200, 420 230 L420 400 L-20 400 Z"
        fill="#b8d4e8"
        opacity={0.55}
      />
      <Path
        d="M40 120 L360 80 L380 160 L320 220 L180 260 L60 200 Z"
        fill="#f4f1e8"
        stroke="#d8d0c0"
        strokeWidth={1}
      />
      <Path d="M0 180 L400 140" stroke="#ffffff" strokeWidth={14} opacity={0.9} />
      <Path d="M0 180 L400 140" stroke="#c8c2b8" strokeWidth={2} />
      <Path d="M120 0 L160 400" stroke="#ffffff" strokeWidth={10} opacity={0.85} />
      <Path d="M120 0 L160 400" stroke="#c8c2b8" strokeWidth={2} />
      <Path d="M280 0 L240 400" stroke="#ffffff" strokeWidth={8} opacity={0.85} />
      <Path d="M280 0 L240 400" stroke="#c8c2b8" strokeWidth={1.5} />
      <Path d="M0 300 Q200 270 400 320" stroke="#ffffff" strokeWidth={8} opacity={0.8} />
      <Path d="M0 300 Q200 270 400 320" stroke="#c8c2b8" strokeWidth={1.5} />
      <Rect x={48} y={88} width={72} height={48} rx={8} fill="#d4ead4" opacity={0.8} />
      <Rect x={260} y={200} width={88} height={56} rx={8} fill="#d4ead4" opacity={0.8} />
      <Rect x={180} y={300} width={64} height={40} rx={8} fill="#d4ead4" opacity={0.7} />
      <Circle cx={200} cy={200} r={120} fill="none" stroke="#c5d0bc" strokeWidth={1} strokeDasharray="6 8" opacity={0.6} />
      <SvgText x={200} y={36} textAnchor="middle" fill={colors.gray500} fontSize={11} fontWeight="600">
        SAMPLE MAP · CAYO AREA
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
  )
}
