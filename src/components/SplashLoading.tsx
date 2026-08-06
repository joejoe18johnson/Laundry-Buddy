import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native'
import { brandColors, spacing } from '../theme'

const mascotSource = require('../../assets/lb-mascot.png')
const mascotAspect =
  Image.resolveAssetSource(mascotSource).width / Image.resolveAssetSource(mascotSource).height

type Props = {
  message?: string
  showTagline?: boolean
}

export function SplashLoading(_props: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  const maxWidth = screenWidth - spacing.screen * 2
  const maxHeight = screenHeight * 0.45
  const widthFromHeight = maxHeight * mascotAspect
  const mascotWidth = Math.min(maxWidth, widthFromHeight)
  const mascotHeight = mascotWidth / mascotAspect

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Image
          source={mascotSource}
          style={{ width: mascotWidth, height: mascotHeight }}
          resizeMode="contain"
          accessibilityLabel="Laundry Buddy"
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.turquoise,
    paddingHorizontal: spacing.screen,
  },
})
