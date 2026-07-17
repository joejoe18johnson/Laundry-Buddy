import { StyleSheet, View, type ViewStyle } from 'react-native'
import { BrandWasherIcon, LB_LOGO_ASPECT } from './BrandWasherIcon'

type Props = {
  /** Logo height in points; width follows the artwork aspect ratio. */
  size?: number
  style?: ViewStyle
  /** Use app variant (white on black) for dark backgrounds */
  variant?: 'light' | 'app'
}

export function AppLogoMark({ size = 40, style, variant = 'light' }: Props) {
  const height = size
  const width = Math.round(size * LB_LOGO_ASPECT)

  return (
    <View
      style={[styles.wrap, { width, height }, style]}
      accessibilityLabel="Laundry Buddy"
    >
      <BrandWasherIcon size={size} variant={variant} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
})
