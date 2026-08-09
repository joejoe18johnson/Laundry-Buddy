import { Image } from 'expo-image'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { resolveAssetSource } from '../lib/resolveAssetSource'

const mascotSource = require('../../assets/mascot-animated.gif')
const mascotAsset = resolveAssetSource(mascotSource)
const mascotAspectRatio =
  mascotAsset?.width && mascotAsset?.height
    ? mascotAsset.width / mascotAsset.height
    : 1

/** Turquoise splash while auth/session loads — animated mascot on brand background. */
export function SplashLoading() {
  const mascotStyle = useMemo(
    () => [styles.mascot, { aspectRatio: mascotAspectRatio }],
    []
  )

  return (
    <View style={styles.container}>
      <Image
        source={mascotSource}
        style={mascotStyle}
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
