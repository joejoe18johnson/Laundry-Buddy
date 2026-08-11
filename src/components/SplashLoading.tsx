import { Image } from 'expo-image'
import { Image as RNImage, StyleSheet, View } from 'react-native'

const mascotSource = require('../../assets/mascot-animated.gif')
const resolved = RNImage.resolveAssetSource(mascotSource)
const mascotAspectRatio = resolved.width / resolved.height

/** Turquoise splash while auth/session loads — animated mascot on brand background. */
export function SplashLoading() {
  return (
    <View style={styles.container}>
      <Image
        source={mascotSource}
        style={[styles.mascot, { aspectRatio: mascotAspectRatio }]}
        contentFit="contain"
        accessibilityLabel="Laundry Buddy mascot"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00CBA9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  mascot: {
    width: '72%',
    maxWidth: 320,
    maxHeight: '55%',
  },
})
