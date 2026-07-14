import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { WEATHER } from '../data/mockData'
import { colors, radius, spacing } from '../theme'

export function WeatherBanner() {
  return (
    <View style={styles.banner}>
      <AppIcon name="cloud-rain" size={16} color={colors.gray600} />
      <Text style={styles.text} numberOfLines={2}>
        {WEATHER.headline}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray600,
    lineHeight: 18,
  },
})
