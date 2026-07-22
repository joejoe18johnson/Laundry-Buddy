import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, Screen } from '../../components/ui'
import { VerificationPromptBanner } from '../../components/VerificationPromptBanner'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { getHostByUserId } from '../../data/mockData'
import {
  canBookOrHost,
  formatIdDocumentType,
  getIdentityVerification,
  verificationStatusLabel,
} from '../../lib/identityVerification'
import { formatWhatsAppNumberDisplay } from '../../lib/whatsappVerification'
import { formatDryTimeStat } from '../../lib/turnaroundTime'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'

function DetailRow({
  icon,
  label,
  value,
  styles,
}: {
  icon: 'user' | 'phone' | 'mail' | 'map-pin' | 'shield' | 'wind' | 'credit-card'
  label: string
  value: string
  styles: ReturnType<typeof createAccountStyles>
}) {
  const { colors } = useTheme()
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <AppIcon name={icon} size={16} color={colors.gray600} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{toTitleCase(label)}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  )
}

function createAccountStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    title: { fontSize: 26, fontWeight: '700', lineHeight: 32, color: colors.black },
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
    name: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: spacing.sm, color: colors.black },
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
    sectionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.gray500,
      letterSpacing: 0.4,
      marginBottom: spacing.sm,
    },
    card: {
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.md,
      marginBottom: spacing.lg,
      backgroundColor: colors.white,
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
}

export function AccountScreen() {
  const { user } = useAuth()
  const { navigate } = useApp()
  const { colors } = useTheme()
  const styles = useMemo(() => createAccountStyles(colors), [colors])

  if (!user) return null

  const isCustomer = user.role === 'customer'
  const hostProfile = !isCustomer ? getHostByUserId(user.id) : undefined
  const verification = getIdentityVerification(user)
  const backScreen = isCustomer ? 'customer-home' : 'host-dashboard'
  const verificationLabel = verificationStatusLabel(verification.status, user.role)
  const verifiedPhone = verification.verifiedPhone ?? user.phone

  return (
    <Screen>
      <BackButton onPress={() => navigate(backScreen)} label="Back" />
      <View style={styles.titleRow}>
        <AppIcon name="user" size={22} color={colors.black} />
        <Text style={styles.title}>{toTitleCase('Account')}</Text>
      </View>
      <Text style={styles.subtitle}>{toTitleCase('Your Profile And Contact Details')}</Text>

      <View style={styles.avatar}>
        <AppIcon name="user" size={28} color={colors.black} />
      </View>
      <Text style={styles.name}>{user.name}</Text>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{toTitleCase(isCustomer ? 'Guest' : 'Host')}</Text>
      </View>

      {!canBookOrHost(user) ? (
        <>
          <Text style={styles.sectionLabel}>{toTitleCase('Verification center')}</Text>
          <VerificationPromptBanner
            role={user.role}
            status={verification.status}
            onPress={() => navigate('identity-verification')}
          />
        </>
      ) : null}

      <View style={styles.card}>
        <DetailRow icon="user" label="Name" value={user.name} styles={styles} />
        {verifiedPhone ? (
          <DetailRow
            icon="phone"
            label="WhatsApp"
            value={formatWhatsAppNumberDisplay(verifiedPhone)}
            styles={styles}
          />
        ) : null}
        {user.email ? <DetailRow icon="mail" label="Email" value={user.email} styles={styles} /> : null}
        <DetailRow icon="shield" label="Verification" value={verificationLabel} styles={styles} />
        {verification.idType ? (
          <DetailRow icon="credit-card" label="ID on file" value={formatIdDocumentType(verification.idType)} styles={styles} />
        ) : null}
        {!isCustomer && verification.address ? (
          <DetailRow icon="map-pin" label="Listed Address" value={verification.address} styles={styles} />
        ) : null}
        {!isCustomer && hostProfile ? (
          <DetailRow
            icon="wind"
            label="Dry Time"
            value={formatDryTimeStat(hostProfile.turnaroundHours)}
            styles={styles}
          />
        ) : null}
      </View>

      <Text style={styles.note}>
        {isCustomer
          ? 'Need To Update Your Details? Contact Support From The Help Menu.'
          : 'Update your bio, house rules, and prices in Host Profile from the menu.'}
      </Text>
    </Screen>
  )
}
