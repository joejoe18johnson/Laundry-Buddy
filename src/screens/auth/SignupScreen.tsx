import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { BackButton, MethodTabs, PrimaryButton, Screen } from '../../components/ui'
import { AppIcon } from '../../components/AppIcon'
import { colors, radius, spacing } from '../../theme'
import type { AppRole, LoginMethod } from '../../types'

export function SignupScreen() {
  const { signup, navigateAuth, authError, clearAuthError } = useAuth()
  const [method, setMethod] = useState<LoginMethod>('phone')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>('customer')

  const handleSignup = async () => {
    clearAuthError()
    await signup({
      name,
      method,
      phone: method === 'phone' ? phone : undefined,
      email: method === 'email' ? email : undefined,
      password,
      role,
    })
  }

  return (
    <Screen>
      <BackButton onPress={() => navigateAuth('welcome')} />
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Join as a guest or host your dryer</Text>

      <View style={styles.roleRow}>
        {(['customer', 'host'] as const).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRole(r)}
            style={[styles.roleCard, role === r && styles.roleSelected]}
          >
            <AppIcon name={r === 'customer' ? 'search' : 'home'} size={20} />
            <Text style={styles.roleTitle}>{r === 'customer' ? 'I need a dryer' : 'I have a dryer'}</Text>
            <Text style={styles.roleSub}>
              {r === 'customer' ? 'Book loads near you' : 'Host & help neighbors'}
            </Text>
          </Pressable>
        ))}
      </View>

      {role === 'host' && (
        <View style={styles.notice}>
          <AppIcon name="shield" size={16} color={colors.gray600} />
          <Text style={styles.noticeText}>Hosts must verify ID and address before accepting loads.</Text>
        </View>
      )}

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

      <View style={styles.field}>
        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.input} placeholder="Your name" value={name} onChangeText={setName} />
      </View>

      {method === 'phone' ? (
        <View style={styles.field}>
          <Text style={styles.label}>Phone number</Text>
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
          <Text style={styles.label}>Email</Text>
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
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="At least 6 characters"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {authError && <Text style={styles.error}>{authError}</Text>}

      <PrimaryButton
        title={role === 'host' ? 'Continue to verification' : 'Create account'}
        onPress={handleSignup}
        full
      />

      <Pressable onPress={() => navigateAuth('login')} style={styles.switch}>
        <Text style={styles.switchText}>
          Already have an account? <Text style={styles.link}>Log in</Text>
        </Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', marginBottom: spacing.sm, lineHeight: 34 },
  subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  roleCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  roleSelected: { borderColor: colors.black, backgroundColor: colors.gray50 },
  roleTitle: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm },
  roleSub: { fontSize: 12, color: colors.gray500, lineHeight: 18 },
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
  field: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray600, marginBottom: spacing.sm },
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
