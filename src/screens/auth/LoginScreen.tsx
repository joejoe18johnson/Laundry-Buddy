import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { BiometricDivider, BiometricLoginButton } from '../../components/BiometricLoginButton'
import { AppTextInput, BackButton, MethodTabs, PasswordInput, PrimaryButton, Screen } from '../../components/ui'
import { AppIcon } from '../../components/AppIcon'
import { radius, spacing } from '../../theme'
import { toTitleCase } from '../../lib/titleCase'
import { isSupabaseConfigured } from '../../lib/supabase'
import type { LoginMethod } from '../../types'

function createLoginStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    title: { fontSize: 28, fontWeight: '700', marginBottom: spacing.sm, lineHeight: 34, color: colors.black },
    subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
    field: { marginBottom: spacing.md },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    label: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
    phoneRow: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.gray200,
      borderRadius: radius.sm,
      overflow: 'hidden',
      backgroundColor: colors.white,
    },
    prefix: {
      padding: 16,
      backgroundColor: colors.gray50,
      borderRightWidth: 1,
      borderRightColor: colors.gray200,
      fontSize: 16,
      color: colors.gray600,
    },
    phoneInput: {
      flex: 1,
      borderWidth: 0,
      padding: 16,
      backgroundColor: colors.white,
    },
    error: {
      color: colors.danger,
      backgroundColor: colors.gray50,
      padding: spacing.md,
      borderRadius: radius.sm,
      marginBottom: spacing.md,
      fontSize: 14,
      lineHeight: 20,
    },
    info: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.greenBg,
      padding: spacing.md,
      borderRadius: radius.sm,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.green,
    },
    infoText: { flex: 1, fontSize: 14, color: colors.green, lineHeight: 20, fontWeight: '600' },
    switch: { marginTop: spacing.xl, alignItems: 'center', paddingVertical: spacing.sm },
    switchText: { fontSize: 14, color: colors.gray500 },
    link: { fontWeight: '600', color: colors.black, textDecorationLine: 'underline' },
  })
}

export function LoginScreen() {
  const {
    login,
    loginWithBiometrics,
    navigateAuth,
    authError,
    authNotice,
    clearAuthError,
    clearAuthNotice,
    biometricSupport,
    biometricEnabled,
  } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createLoginStyles(colors), [colors])
  const usingSupabase = isSupabaseConfigured()
  const [method, setMethod] = useState<LoginMethod>(usingSupabase ? 'email' : 'phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [biometricLoading, setBiometricLoading] = useState(false)

  const showBiometric = biometricSupport.available && biometricEnabled

  const handleLogin = async () => {
    clearAuthError()
    clearAuthNotice()
    const loginMethod = usingSupabase ? 'email' : method
    await login(loginMethod, loginMethod === 'phone' ? phone : email, password)
  }

  const handleBiometricLogin = async () => {
    clearAuthError()
    setBiometricLoading(true)
    await loginWithBiometrics()
    setBiometricLoading(false)
  }

  return (
    <Screen>
      <BackButton onPress={() => navigateAuth('welcome')} />
      <Text style={styles.title}>{toTitleCase('Welcome back')}</Text>
      <Text style={styles.subtitle}>
        {toTitleCase(usingSupabase ? 'Log in with your email and password' : 'Log in with your phone or email')}
      </Text>

      {showBiometric ? (
        <>
          <BiometricLoginButton
            support={biometricSupport}
            onPress={handleBiometricLogin}
            loading={biometricLoading}
            variant="primary"
          />
          <BiometricDivider />
        </>
      ) : null}

      {!usingSupabase ? (
        <MethodTabs
          value={method}
          options={[
            { value: 'phone', label: 'Phone', icon: 'smartphone' },
            { value: 'email', label: 'Email', icon: 'mail' },
          ]}
          onChange={(m) => {
            setMethod(m)
            clearAuthError()
          }}
        />
      ) : null}

      {!usingSupabase && method === 'phone' ? (
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <AppIcon name="smartphone" size={16} color={colors.gray600} />
            <Text style={styles.label}>{toTitleCase('Phone number')}</Text>
          </View>
          <View style={styles.phoneRow}>
            <Text style={styles.prefix}>+501</Text>
            <AppTextInput
              style={styles.phoneInput}
              placeholder="600 1234"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>
      ) : (
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <AppIcon name="mail" size={16} color={colors.gray600} />
            <Text style={styles.label}>{toTitleCase('Email')}</Text>
          </View>
          <AppTextInput
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
      )}

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <AppIcon name="lock" size={16} color={colors.gray600} />
          <Text style={styles.label}>{toTitleCase('Password')}</Text>
        </View>
        <PasswordInput
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {authNotice ? (
        <View style={styles.info}>
          <AppIcon name="mail" size={18} color={colors.green} />
          <Text style={styles.infoText}>{toTitleCase(authNotice)}</Text>
        </View>
      ) : null}

      {authError && <Text style={styles.error}>{authError}</Text>}

      <PrimaryButton title="Log in" onPress={handleLogin} full />

      <Pressable onPress={() => navigateAuth('signup')} style={styles.switch}>
        <Text style={styles.switchText}>
          {toTitleCase('New here?')} <Text style={styles.link}>{toTitleCase('Create account')}</Text>
        </Text>
      </Pressable>
    </Screen>
  )
}
