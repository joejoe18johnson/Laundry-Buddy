import { StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native'
import { BrandWasherIcon, LB_LOGO_ASPECT } from './BrandWasherIcon'
import { spacing } from '../theme'

type Props = {
  /** Logo height in points; width follows the artwork aspect ratio. */
  size?: number
  style?: ViewStyle
  /** Use app variant (white on black) for dark backgrounds */
  variant?: 'light' | 'app'
}

export function AppLogoMark({ size = 40, style, variant = 'light' }: Props) {
  const { width: screenWidth } = useWindowDimensions()
  const maxLogoWidth = Math.max(120, screenWidth - spacing.screen * 2)
  const naturalWidth = size * LB_LOGO_ASPECT
  const scale = naturalWidth > maxLogoWidth ? maxLogoWidth / naturalWidth : 1
  const height = Math.round(size * scale)
  const width = Math.round(height * LB_LOGO_ASPECT)

  return (
    <View
      style={[styles.wrap, { width, height, flexShrink: 0 }, style]}
      accessibilityLabel="Laundry Buddy"
    >
      <BrandWasherIcon size={height} variant={variant} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
