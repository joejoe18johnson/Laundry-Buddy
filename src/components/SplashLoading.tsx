import { StyleSheet, Text, View } from 'react-native'
import { SplashWasherAnimation } from './SplashWasherAnimation'
import { colors, spacing } from '../theme'

type Props = {
  message?: string
  showTagline?: boolean
}

export function SplashLoading({ message, showTagline = true }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <SplashWasherAnimation />
      </View>
      {message ? <Text style={styles.brand}>{message}</Text> : null}
      {showTagline ? <Text style={styles.tagline}>Dry Laundry, Rain or Shine</Text> : null}
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
  },
  logoWrap: {
    marginBottom: spacing.lg,
  },
  brand: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.black,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  tagline: {
    marginTop: spacing.sm,
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray500,
    textAlign: 'center',
  },
})
