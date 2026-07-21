import { Image, StyleSheet } from 'react-native'

type Props = {
  /** Logo height in points; width follows the artwork aspect ratio. */
  size?: number
  /** Kept for API compatibility — artwork is always the transparent PNG mark. */
  variant?: 'light' | 'app'
}

const logoSource = require('../../assets/brand-logo.png')
const resolvedLogo = Image.resolveAssetSource(logoSource)

/** Native width ÷ height of `assets/brand-logo.png`. */
export const LB_LOGO_ASPECT = resolvedLogo.width / resolvedLogo.height

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
  image: {
    flexShrink: 0,
  },
})
