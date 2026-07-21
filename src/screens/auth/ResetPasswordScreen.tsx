import { useMemo, useState } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { BackButton, PasswordInput, PrimaryButton, Screen } from '../../components/ui'
import { radius, spacing } from '../../theme'
import { toTitleCase } from '../../lib/titleCase'

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    title: {
      fontSize: 28,
      fontWeight: '700',
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      lineHeight: 34,
      color: colors.black,
    },
    subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
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
  })
}

export function ResetPasswordScreen() {
  const { resetPassword, navigateAuth, authError, clearAuthError } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (submitting) return
    clearAuthError()
    setSubmitting(true)
    try {
      await resetPassword(password, confirmPassword)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <BackButton onPress={() => navigateAuth('login')} />
      <Text style={styles.title}>{toTitleCase('Choose new password')}</Text>
      <Text style={styles.subtitle}>
        {toTitleCase('Set a new password for your account, then log in with your phone number.')}
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>{toTitleCase('New password')}</Text>
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

      {authError ? <Text style={styles.error}>{authError}</Text> : null}

      <PrimaryButton
        title={submitting ? 'Updating…' : 'Update password'}
        onPress={handleSubmit}
        full
        disabled={submitting}
      />
    </Screen>
  )
}
