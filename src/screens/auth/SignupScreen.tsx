import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { AppTextInput, BackButton, BrandSwitch, PasswordInput, PrimaryButton, Screen } from '../../components/ui'
import { AppIcon } from '../../components/AppIcon'
import { isValidEmail } from '../../lib/email'
import { isSupabaseConfigured } from '../../lib/supabase'
import { radius, spacing } from '../../theme'
import { titleCaseWithName, toTitleCase } from '../../lib/titleCase'
import type { AppRole } from '../../types'

function createSignupStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    title: { fontSize: 28, fontWeight: '700', marginBottom: spacing.sm, lineHeight: 34, color: colors.black },
    subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
    roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    roleCard: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
      minHeight: 120,
    },
    roleSelected: { borderColor: colors.black, backgroundColor: colors.gray50 },
    roleTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4, color: colors.black },
    roleSub: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.gray50,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    noticeText: { fontSize: 13, color: colors.gray600, lineHeight: 20 },
    quickAccessCard: {
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      backgroundColor: colors.gray50,
    },
    quickAccessHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    quickAccessText: { flex: 1, gap: 4 },
    quickAccessTitle: { fontSize: 15, fontWeight: '700', color: colors.black },
    quickAccessSub: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
    field: { marginBottom: spacing.md },
    label: { fontSize: 13, fontWeight: '600', color: colors.gray600, marginBottom: spacing.sm },
    error: {
      color: colors.danger,
      backgroundColor: colors.gray50,
      padding: spacing.md,
      borderRadius: radius.sm,
      marginBottom: spacing.md,
      fontSize: 14,
      lineHeight: 20,
    },
    switch: { marginTop: spacing.xl, alignItems: 'center', paddingVertical: spacing.sm },
    switchText: { fontSize: 14, color: colors.gray500 },
    link: { fontWeight: '600', color: colors.black, textDecorationLine: 'underline' },
  })
}

export function SignupScreen() {
  const { signup, navigateAuth, authError, clearAuthError, biometricSupport } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createSignupStyles(colors), [colors])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<AppRole>('customer')
  const [enableQuickAccess, setEnableQuickAccess] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const usingSupabase = isSupabaseConfigured()

  const handleSignup = async () => {
    clearAuthError()
    setLocalError(null)

    if (!name.trim()) {
      setLocalError('Full name is required.')
      return
    }
    if (!email.trim()) {
      setLocalError('Email is required.')
      return
    }
    if (!isValidEmail(email)) {
      setLocalError('Enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }

    await signup({
      name,
      method: 'email',
      email,
      password,
      confirmPassword,
      role,
      enableQuickAccess,
    })
  }

  const displayError = localError ?? authError

  return (
    <Screen>
      <BackButton onPress={() => navigateAuth('welcome')} />
      <Text style={styles.title}>{toTitleCase('Create account')}</Text>
      <Text style={styles.subtitle}>
        {toTitleCase(usingSupabase ? 'Sign up with your email — free to get started' : 'Join as a guest or host your dryer')}
      </Text>

      <View style={styles.roleRow}>
        {(['customer', 'host'] as const).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRole(r)}
            style={[styles.roleCard, role === r && styles.roleSelected]}
          >
            <AppIcon name={r === 'customer' ? 'search' : 'home'} size={20} />
            <Text style={styles.roleTitle}>
              {toTitleCase(r === 'customer' ? 'I need a dryer' : 'I have a dryer')}
            </Text>
            <Text style={styles.roleSub}>
              {toTitleCase(r === 'customer' ? 'Book loads near you' : 'Host & help neighbors')}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.notice}>
        <AppIcon name="shield" size={16} color={colors.gray600} />
        <Text style={styles.noticeText}>
          {toTitleCase(
            usingSupabase
              ? role === 'host'
                ? 'After sign-up, verify your ID in the app. WhatsApp can be added later for host contact — not required to create an account.'
                : 'After sign-up, verify your ID in the app. Email keeps account creation free — no SMS fees.'
              : role === 'host'
              ? 'Next: add your WhatsApp number, passport, driver\'s license, or social security card, and host address.'
              : 'Next: add your WhatsApp number, passport, driver\'s license, or social security card.',
          )}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{toTitleCase('Full name')}</Text>
        <AppTextInput placeholder="Your name" value={name} onChangeText={setName} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{toTitleCase('Email')}</Text>
        <AppTextInput
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{toTitleCase('Password')}</Text>
        <PasswordInput
          placeholder="At least 6 characters"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{toTitleCase('Confirm password')}</Text>
        <PasswordInput
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      {biometricSupport.available ? (
        <View style={styles.quickAccessCard}>
          <View style={styles.quickAccessHeader}>
            <AppIcon name={biometricSupport.icon} size={18} color={colors.black} />
            <View style={styles.quickAccessText}>
              <Text style={styles.quickAccessTitle}>
                {titleCaseWithName(`Quick access with ${biometricSupport.label}`, biometricSupport.label)}
              </Text>
              <Text style={styles.quickAccessSub}>
                {titleCaseWithName(
                  `Skip your password next time — sign in with ${biometricSupport.label} after you log out.`,
                  biometricSupport.label,
                )}
              </Text>
            </View>
            <BrandSwitch value={enableQuickAccess} onValueChange={setEnableQuickAccess} />
          </View>
        </View>
      ) : null}

      {displayError && <Text style={styles.error}>{displayError}</Text>}

      <PrimaryButton title="Create account" onPress={handleSignup} full />

      <Pressable onPress={() => navigateAuth('login')} style={styles.switch}>
        <Text style={styles.switchText}>
          {toTitleCase('Already have an account?')} <Text style={styles.link}>{toTitleCase('Log in')}</Text>
        </Text>
      </Pressable>
    </Screen>
  )
}
