import { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { TRAINING_ACCOUNTS, TRAINING_PASSWORD, ACTIVE_REGION_LABEL } from '../../data/seedData'
import { OutlineButton, PrimaryButton, Screen } from '../../components/ui'
import { AppIcon } from '../../components/AppIcon'
import { colors, spacing } from '../../theme'

export function WelcomeScreen() {
  const { navigateAuth, login } = useAuth()
  const [signingIn, setSigningIn] = useState<string | null>(null)

  const handleTrainingLogin = async (loginId: string, type: 'phone' | 'email') => {
    setSigningIn(loginId)
    await login(type, loginId, TRAINING_PASSWORD)
    setSigningIn(null)
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Dry laundry, rain or shine</Text>
        <Text style={styles.tagline}>
          Book a neighbor's dryer in the {ACTIVE_REGION_LABEL} — free for the community.
        </Text>
        <Text style={styles.regionNote}>More districts coming soon.</Text>
      </View>

      <PrimaryButton title="Log in" icon="log-in" onPress={() => navigateAuth('login')} full />
      <View style={styles.gap} />
      <OutlineButton title="Create account" icon="user-plus" onPress={() => navigateAuth('signup')} full />

      <View style={styles.training}>
        <View style={styles.trainingTitleRow}>
          <AppIcon name="users" size={14} color={colors.gray600} />
          <Text style={styles.trainingTitle}>Training accounts · password {TRAINING_PASSWORD}</Text>
        </View>
        {TRAINING_ACCOUNTS.map((a) => (
          <Pressable
            key={a.label}
            style={({ pressed }) => [styles.trainingRow, pressed && styles.trainingRowPressed]}
            onPress={() => handleTrainingLogin(a.login, a.type)}
            disabled={signingIn !== null}
          >
            <AppIcon
              name={a.label.includes('host') ? 'home' : 'user'}
              size={16}
              color={colors.accent}
            />
            <Text style={styles.trainingName}>{a.label}</Text>
            <Text style={[styles.trainingLogin, signingIn === a.login && styles.trainingLoginBusy]}>
              {signingIn === a.login ? 'Signing in…' : a.login}
            </Text></Pressable>
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  hero: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xxl },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5, marginBottom: spacing.md, lineHeight: 40 },
  tagline: { fontSize: 16, color: colors.gray500, lineHeight: 26 },
  regionNote: { fontSize: 13, color: colors.gray400, marginTop: spacing.sm, fontStyle: 'italic' },
  gap: { height: spacing.md },
  training: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  trainingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  trainingTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  trainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginHorizontal: -4,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  trainingRowPressed: { backgroundColor: colors.gray100 },
  trainingName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  trainingLogin: {
    fontSize: 12,
    color: colors.gray500,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginLeft: spacing.sm,
  },
  trainingLoginBusy: { color: colors.gray500, textDecorationLine: 'none' },
})
