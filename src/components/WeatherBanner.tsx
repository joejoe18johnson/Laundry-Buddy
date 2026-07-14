import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { WEATHER } from '../data/mockData'
import { colors, radius, spacing } from '../theme'

export function WeatherBanner() {
  return (
    <View style={styles.banner}>
      <View style={styles.headlineRow}>
        <AppIcon name="cloud-rain" size={18} />
        <Text style={styles.headline}>{WEATHER.headline}</Text>
      </View>
      <View style={styles.detailRow}>
        <AppIcon name="users" size={16} color={colors.gray500} />
        <Text style={styles.detail}>{WEATHER.detail}</Text>
      </View>
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
  headlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  headline: { fontSize: 14, fontWeight: '600', color: colors.black, lineHeight: 20, flex: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  detail: { fontSize: 13, color: colors.gray500, lineHeight: 20, flex: 1 },
})
