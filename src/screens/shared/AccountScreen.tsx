import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { getHostByUserId } from '../../data/mockData'
import { colors, radius, spacing } from '../../theme'

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: 'user' | 'phone' | 'mail' | 'map-pin' | 'shield' | 'wind'
  label: string
  value: string
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <AppIcon name={icon} size={16} color={colors.gray600} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  )
}

export function AccountScreen() {
  const { user } = useAuth()
  const { navigate } = useApp()

  if (!user) return null

  const isCustomer = user.role === 'customer'
  const hostProfile = !isCustomer ? getHostByUserId(user.id) : undefined
  const verification = user.hostVerification
  const backScreen = isCustomer ? 'customer-home' : 'host-dashboard'

  const verificationLabel =
    verification?.status === 'verified'
      ? 'Verified host'
      : verification?.status === 'pending'
        ? 'Verification pending'
        : verification?.status === 'rejected'
          ? 'Verification declined'
          : 'Not verified'

  return (
    <Screen>
      <BackButton onPress={() => navigate(backScreen)} label="Back" />
      <View style={styles.titleRow}>
        <AppIcon name="user" size={22} />
        <Text style={styles.title}>Account</Text>
      </View>
      <Text style={styles.subtitle}>Your profile and contact details</Text>

      <View style={styles.avatar}>
        <AppIcon name="user" size={28} />
      </View>
      <Text style={styles.name}>{user.name}</Text>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{isCustomer ? 'Guest' : 'Host'}</Text>
      </View>

      <View style={styles.card}>
        <DetailRow icon="user" label="Name" value={user.name} />
        {user.phone ? <DetailRow icon="phone" label="Phone" value={user.phone} /> : null}
        {user.email ? <DetailRow icon="mail" label="Email" value={user.email} /> : null}
        {!isCustomer && verification ? (
          <>
            <DetailRow icon="shield" label="Host status" value={verificationLabel} />
            {verification.address ? (
              <DetailRow icon="map-pin" label="Listed address" value={verification.address} />
            ) : null}
          </>
        ) : null}
        {!isCustomer && hostProfile ? (
          <DetailRow
            icon="wind"
            label="Dryer setup"
            value={`${hostProfile.turnaroundHours} hr turnaround · ${hostProfile.slotsLeft} slots`}
          />
        ) : null}
      </View>

      <Text style={styles.note}>
        {isCustomer
          ? 'Need to update your details? Contact support from the Help menu.'
          : 'Update your bio, setup, rules, and prices in Host profile from the menu.'}
      </Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  name: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: spacing.sm },
  roleBadge: {
    alignSelf: 'center',
    backgroundColor: colors.gray50,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  roleText: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  card: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 12, color: colors.gray500, fontWeight: '500' },
  rowValue: { fontSize: 15, color: colors.black, lineHeight: 21 },
  note: { fontSize: 13, color: colors.gray500, lineHeight: 19, textAlign: 'center' },
})
