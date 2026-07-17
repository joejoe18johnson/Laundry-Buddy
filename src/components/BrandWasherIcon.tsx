import { Image, StyleSheet } from 'react-native'

type Props = {
  /** Logo height in points; width follows the artwork aspect ratio. */
  size?: number
  /** Kept for API compatibility — artwork is always the transparent PNG mark. */
  variant?: 'light' | 'app'
}

const logoSource = require('../../assets/lb-logo.png')

/** Native width ÷ height of `assets/lb-logo.png`. */
export const LB_LOGO_ASPECT = 3836 / 1228

export function BrandWasherIcon({ size = 40 }: Props) {
  const height = size
  const width = Math.round(size * LB_LOGO_ASPECT)

  return (
    <Image
      source={logoSource}
      style={[styles.image, { width, height }]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  )
}

const styles = StyleSheet.create({
  image: {},
})
