import { StyleSheet, Text, View } from 'react-native'
import { SplashWasherAnimation } from './SplashWasherAnimation'
import { colors, spacing } from '../theme'

type Props = {
  message?: string
}

export function SplashLoading({ message = 'Dry laundry, rain or shine' }: Props) {
  return (
    <View style={styles.container}>
      <SplashWasherAnimation />
      <Text style={styles.title}>{message}</Text>
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
  title: {
    marginTop: spacing.lg,
    fontSize: 28,
    fontWeight: '700',
    color: colors.black,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
})
