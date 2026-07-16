import { StyleSheet, View, type ViewStyle } from 'react-native'
import { BrandWasherIcon } from './BrandWasherIcon'

type Props = {
  size?: number
  style?: ViewStyle
  /** Use app variant (white on black) for dark backgrounds */
  variant?: 'light' | 'app'
}

export function AppLogoMark({ size = 40, style, variant = 'light' }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size }, style]} accessibilityLabel="Laundry Buddy">
      <BrandWasherIcon size={size} variant={variant} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
})
