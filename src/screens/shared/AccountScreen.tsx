import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, BrandSwitch, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import { getHostByUserId } from '../../data/mockData'
import { formatTurnaroundHours } from '../../lib/turnaroundTime'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'

function DetailRow({
  icon,
  label,
  value,
  styles,
}: {
  icon: 'user' | 'phone' | 'mail' | 'map-pin' | 'shield' | 'wind'
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
    appearanceCard: {
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      backgroundColor: colors.gray50,
    },
    appearanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    appearanceText: { flex: 1, gap: 4 },
    appearanceTitle: { fontSize: 15, fontWeight: '700', color: colors.black },
    appearanceSub: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
    securityCard: {
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      backgroundColor: colors.gray50,
    },
    securityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    securityText: { flex: 1, gap: 4 },
    securityTitle: { fontSize: 15, fontWeight: '700', color: colors.black },
    securitySub: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
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
  const {
    user,
    biometricSupport,
    biometricEnabled,
    enableBiometricLogin,
    disableBiometricLogin,
  } = useAuth()
  const { showToast } = useToast()
  const { navigate } = useApp()
  const { colors, isDark, setColorScheme } = useTheme()
  const styles = useMemo(() => createAccountStyles(colors), [colors])

  if (!user) return null

  const isCustomer = user.role === 'customer'
  const hostProfile = !isCustomer ? getHostByUserId(user.id) : undefined
  const verification = user.hostVerification
  const backScreen = isCustomer ? 'customer-home' : 'host-dashboard'

  const verificationLabel =
    verification?.status === 'verified'
      ? 'Verified Host'
      : verification?.status === 'pending'
        ? 'Verification Pending'
        : verification?.status === 'rejected'
          ? 'Verification Declined'
          : 'Not Verified'

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

      <View style={styles.appearanceCard}>
        <View style={styles.appearanceHeader}>
          <AppIcon name={isDark ? 'moon' : 'sun'} size={18} color={colors.black} />
          <View style={styles.appearanceText}>
            <Text style={styles.appearanceTitle}>{toTitleCase('Dark Mode')}</Text>
            <Text style={styles.appearanceSub}>
              {toTitleCase(isDark ? 'Dark Theme Is On' : 'Light Theme Is On')}
            </Text>
          </View>
          <BrandSwitch value={isDark} onValueChange={(enabled) => setColorScheme(enabled ? 'dark' : 'light')} />
        </View>
      </View>

      <View style={styles.card}>
        <DetailRow icon="user" label="Name" value={user.name} styles={styles} />
        {user.phone ? <DetailRow icon="phone" label="Phone" value={user.phone} styles={styles} /> : null}
        {user.email ? <DetailRow icon="mail" label="Email" value={user.email} styles={styles} /> : null}
        {!isCustomer && verification ? (
          <>
            <DetailRow icon="shield" label="Host Status" value={verificationLabel} styles={styles} />
            {verification.address ? (
              <DetailRow icon="map-pin" label="Listed Address" value={verification.address} styles={styles} />
            ) : null}
          </>
        ) : null}
        {!isCustomer && hostProfile ? (
          <DetailRow
            icon="wind"
            label="Dryer Setup"
            value={`${formatTurnaroundHours(hostProfile.turnaroundHours)} Turnaround · ${hostProfile.slotsLeft} Slots`}
            styles={styles}
          />
        ) : null}
      </View>

      {biometricSupport.available ? (
        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <AppIcon name={biometricSupport.icon} size={18} color={colors.black} />
            <View style={styles.securityText}>
              <Text style={styles.securityTitle}>{biometricSupport.label} Sign-In</Text>
              <Text style={styles.securitySub}>
                Sign In With {biometricSupport.label} When You Log Back In — Not While Using The App
              </Text>
            </View>
            <BrandSwitch
              value={biometricEnabled}
              onValueChange={(next) => {
                if (next) {
                  void enableBiometricLogin().then((ok) => {
                    if (ok) showToast('Biometric sign-in saved', { icon: 'check' })
                  })
                } else {
                  void disableBiometricLogin().then(() => {
                    showToast('Biometric sign-in turned off', { icon: 'check' })
                  })
                }
              }}
            />
          </View>
        </View>
      ) : null}

      <Text style={styles.note}>
        {isCustomer
          ? 'Need To Update Your Details? Contact Support From The Help Menu.'
          : 'Update Your Bio, Setup, Rules, And Prices In Host Profile From The Menu.'}
      </Text>
    </Screen>
  )
}
