import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { DEMO_ANA_MARIA_BOOKING_ID } from '../data/seedData'
import { toTitleCase } from '../lib/titleCase'
import { useTheme } from '../context/ThemeContext'
import { radius, spacing } from '../theme'

export function isDemoAnaMariaBooking(bookingId?: string | null) {
  return bookingId === DEMO_ANA_MARIA_BOOKING_ID
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
                'This load is linked to Maria’s host account. Chat here, then log out and sign in as Maria (maria@example.com) to accept updates and reply.',
              )
            : toTitleCase(
                'This load is linked to Ana’s guest account. Reply in chat, then log out and sign in as Ana (6001111) to see her side.',
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
