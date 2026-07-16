import { Image, StyleSheet } from 'react-native'

type Props = {
  size?: number
  /** Kept for API compatibility — artwork is always the transparent PNG mark. */
  variant?: 'light' | 'app'
}

const logoMark = require('../../assets/logo-mark.png')

export function BrandWasherIcon({ size = 220 }: Props) {
  return (
    <Image
      source={logoMark}
      style={[styles.image, { width: size, height: size }]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  )
}

const styles = StyleSheet.create({
  image: {},
})
