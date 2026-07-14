import { StyleSheet, Text, View } from 'react-native'
import { WEATHER } from '../data/mockData'
import { colors, radius, spacing } from '../theme'

export function WeatherBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.headline}>{WEATHER.headline}</Text>
      <Text style={styles.detail}>{WEATHER.detail}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  headline: { fontSize: 14, fontWeight: '600', color: colors.black, marginBottom: spacing.sm, lineHeight: 20 },
  detail: { fontSize: 13, color: colors.gray500, lineHeight: 20 },
})
