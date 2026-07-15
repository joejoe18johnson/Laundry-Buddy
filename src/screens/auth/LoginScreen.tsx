import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { BiometricDivider, BiometricLoginButton } from '../../components/BiometricLoginButton'
import { BackButton, MethodTabs, PrimaryButton, Screen } from '../../components/ui'
import { AppIcon } from '../../components/AppIcon'
import { colors, radius, spacing } from '../../theme'
import type { LoginMethod } from '../../types'

export function LoginScreen() {
  const {
    login,
    loginWithBiometrics,
    navigateAuth,
    authError,
    clearAuthError,
    biometricSupport,
    biometricEnabled,
  } = useAuth()
  const [method, setMethod] = useState<LoginMethod>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [biometricLoading, setBiometricLoading] = useState(false)

  const showBiometric = biometricSupport.available && biometricEnabled

  const handleLogin = async () => {
    clearAuthError()
    await login(method, method === 'phone' ? phone : email, password)
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
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in with your phone or email</Text>

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

      {method === 'phone' ? (
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <AppIcon name="smartphone" size={16} color={colors.gray600} />
            <Text style={styles.label}>Phone number</Text>
          </View>
          <View style={styles.phoneRow}>
            <Text style={styles.prefix}>+501</Text>
            <TextInput
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
            <Text style={styles.label}>Email</Text>
          </View>
          <TextInput
            style={styles.input}
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
          <Text style={styles.label}>Password</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {authError && <Text style={styles.error}>{authError}</Text>}

      <PrimaryButton title="Log in" onPress={handleLogin} full />

      <Pressable onPress={() => navigateAuth('signup')} style={styles.switch}>
        <Text style={styles.switchText}>
          New here? <Text style={styles.link}>Create account</Text>
        </Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', marginBottom: spacing.sm, lineHeight: 34 },
  subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
  field: { marginBottom: spacing.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.sm,
    padding: 16,
    fontSize: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  prefix: {
    padding: 16,
    backgroundColor: colors.gray50,
    borderRightWidth: 1,
    borderRightColor: colors.gray200,
    fontSize: 16,
    color: colors.gray600,
  },
  phoneInput: { flex: 1, padding: 16, fontSize: 16 },
  error: {
    color: colors.danger,
    backgroundColor: '#fef2f2',
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
