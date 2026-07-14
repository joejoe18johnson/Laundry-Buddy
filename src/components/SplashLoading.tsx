import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme'

type Props = {
  message?: string
}

export function SplashLoading({ message = 'Dry laundry, rain or shine' }: Props) {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/splash-icon.png')} style={styles.logo} accessibilityLabel="Laundry Buddy" />
      <Text style={styles.brand}>Laundry Buddy</Text>
      <Text style={styles.tagline}>{message}</Text>
      <ActivityIndicator size="large" color={colors.accent} style={styles.spinner} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
  },
  spinner: {
    marginTop: 32,
  },
})
