import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { BackButton, MethodTabs, PrimaryButton, Screen } from '../../components/ui'
import { colors, radius } from '../../theme'
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
            <Text style={styles.roleTitle}>{r === 'customer' ? 'I need a dryer' : 'I have a dryer'}</Text>
            <Text style={styles.roleSub}>
              {r === 'customer' ? 'Book loads near you' : 'Host & help neighbors'}
            </Text>
          </Pressable>
        ))}
      </View>

      {role === 'host' && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>Hosts must verify ID and address before accepting loads.</Text>
        </View>
      )}

      <MethodTabs
        value={method}
        options={[
          { value: 'phone', label: 'Phone' },
          { value: 'email', label: 'Email' },
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
  title: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 15, color: colors.gray500, marginBottom: 20 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    padding: 14,
  },
  roleSelected: { borderColor: colors.black, backgroundColor: colors.gray50 },
  roleTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  roleSub: { fontSize: 12, color: colors.gray500 },
  notice: {
    backgroundColor: colors.gray50,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  noticeText: { fontSize: 13, color: colors.gray600 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray600, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.sm,
    padding: 14,
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
    padding: 14,
    backgroundColor: colors.gray50,
    borderRightWidth: 1,
    borderRightColor: colors.gray200,
    fontSize: 16,
    color: colors.gray600,
  },
  phoneInput: { flex: 1, padding: 14, fontSize: 16 },
  error: {
    color: colors.danger,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: radius.sm,
    marginBottom: 16,
    fontSize: 14,
  },
  switch: { marginTop: 24, alignItems: 'center' },
  switchText: { fontSize: 14, color: colors.gray500 },
  link: { fontWeight: '600', color: colors.black, textDecorationLine: 'underline' },
})
