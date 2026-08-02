import { Image, StyleSheet } from 'react-native'

type Props = {
  /** Mascot height in points; width follows the artwork aspect ratio. */
  size?: number
}

const mascotSource = require('../../assets/lb-mascot.png')
const resolved = Image.resolveAssetSource(mascotSource)

/** Native width ÷ height of `assets/lb-mascot.png`. */
export const LB_MASCOT_ASPECT = resolved.width / resolved.height

export function BrandMascot({ size = 88 }: Props) {
  const height = size
  const width = Math.round(size * LB_MASCOT_ASPECT)

  return (
    <Image
      source={mascotSource}
      style={[styles.image, { width, height }]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
      accessibilityLabel="Laundry Buddy mascot"
    />
  )
}

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
  },
})
