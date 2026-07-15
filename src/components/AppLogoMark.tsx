import { Image, StyleSheet, View, type ViewStyle } from 'react-native'

type Props = {
  size?: number
  style?: ViewStyle
}

export function AppLogoMark({ size = 40, style }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.22 }, style]}>
      <Image
        source={require('../../assets/splash-icon.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="Laundry Buddy"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
})
