import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { AppTextInput, BackButton, PrimaryButton, Screen } from '../../components/ui'
import { AppIcon } from '../../components/AppIcon'
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
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    label: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.gray50,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    noticeText: { flex: 1, fontSize: 13, color: colors.gray600, lineHeight: 20 },
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

export function ForgotPasswordScreen() {
  const { requestPasswordReset, navigateAuth, authError, clearAuthError } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (submitting) return
    clearAuthError()
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <BackButton onPress={() => navigateAuth('login')} />
      <Text style={styles.title}>{toTitleCase('Forgot password')}</Text>
      <Text style={styles.subtitle}>
        {toTitleCase('Enter the email you used at sign-up. We will send a reset link there.')}
      </Text>

      {!isSupabaseConfigured() ? (
        <View style={styles.notice}>
          <AppIcon name="alert-circle" size={16} color={colors.gray600} />
          <Text style={styles.noticeText}>
            {toTitleCase('Password reset requires an online connection to Laundry Buddy servers.')}
          </Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <AppIcon name="mail" size={16} color={colors.gray600} />
          <Text style={styles.label}>{toTitleCase('Email')}</Text>
        </View>
        <AppTextInput
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {authError ? <Text style={styles.error}>{authError}</Text> : null}

      <PrimaryButton
        title={submitting ? 'Sending link…' : 'Send reset link'}
        onPress={handleSubmit}
        full
        disabled={submitting || !isSupabaseConfigured()}
      />

      <Pressable onPress={() => navigateAuth('login')} style={styles.switch}>
        <Text style={styles.switchText}>
          {toTitleCase('Remember your password?')} <Text style={styles.link}>{toTitleCase('Log in')}</Text>
        </Text>
      </Pressable>
    </Screen>
  )
}
