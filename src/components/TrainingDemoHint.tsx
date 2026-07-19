import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { DEMO_ANA_MARIA_BOOKING_IDS } from '../data/seedData'
import { toTitleCase } from '../lib/titleCase'
import { useTheme } from '../context/ThemeContext'
import { radius, spacing } from '../theme'

export function isDemoAnaMariaBooking(bookingId?: string | null) {
  return !!bookingId && DEMO_ANA_MARIA_BOOKING_IDS.includes(bookingId as (typeof DEMO_ANA_MARIA_BOOKING_IDS)[number])
}

export function TrainingDemoHint({ role }: { role: 'customer' | 'host' }) {
  const { colors } = useTheme()

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.gray50,
          borderColor: colors.gray200,
        },
      ]}
    >
      <AppIcon name="users" size={16} color={colors.black} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.black }]}>
          {toTitleCase('Ana ↔ Maria training demo')}
        </Text>
        <Text style={[styles.body, { color: colors.gray600 }]}>
          {role === 'customer'
            ? toTitleCase(
                'Load 2 is ready to pay — open My loads, use the Pay now banner, transfer, and submit your receipt.',
              )
            : toTitleCase(
                'Load 2: confirm payment after Ana submits proof, then start drying and mark ready.',
              )}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  body: { fontSize: 13, lineHeight: 19 },
})
