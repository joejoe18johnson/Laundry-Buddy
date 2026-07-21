import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AppLogoMark } from './AppLogoMark'
import { toTitleCase } from '../lib/titleCase'
import { colors, spacing } from '../theme'

type Props = {
  message?: string
  showTagline?: boolean
}

export function SplashLoading({ message, showTagline = true }: Props) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  return (
    <View style={styles.container}>
      <AppLogoMark size={88} style={styles.logo} />
      {message ? <Text style={styles.brand}>{message}</Text> : null}
      {showTagline ? <Text style={styles.tagline}>{toTitleCase('Dry Laundry, Rain or Shine')}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  logo: { alignSelf: 'center' },
  brand: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.black,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray500,
    textAlign: 'center',
  },
})
