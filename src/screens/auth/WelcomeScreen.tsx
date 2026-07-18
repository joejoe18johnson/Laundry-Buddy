import { useEffect, useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { TRAINING_ACCOUNTS, TRAINING_DEMO_STEPS, TRAINING_PASSWORD, ACTIVE_REGION_LABEL } from '../../data/seedData'
import { isFullFlowTesting } from '../../lib/testingFlow'
import { toTitleCase } from '../../lib/titleCase'
import { AppLogoMark } from '../../components/AppLogoMark'
import { BiometricDivider, BiometricLoginButton } from '../../components/BiometricLoginButton'
import { OutlineButton, PrimaryButton, Screen } from '../../components/ui'
import { AppIcon } from '../../components/AppIcon'
import { spacing } from '../../theme'

function createWelcomeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flexGrow: 1 },
    hero: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xxl, alignItems: 'center' },
    logo: { marginBottom: spacing.lg },
    title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5, marginBottom: spacing.md, lineHeight: 40, textAlign: 'center' },
    tagline: { fontSize: 16, color: colors.gray500, lineHeight: 26, textAlign: 'center' },
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
    demoSteps: { marginTop: spacing.md, gap: 6, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.gray100 },
    demoStep: { fontSize: 12, color: colors.gray600, lineHeight: 18 },
  })
}

export function WelcomeScreen() {
  const { navigateAuth, login, loginWithBiometrics, biometricSupport, biometricEnabled } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createWelcomeStyles(colors), [colors])
  const [signingIn, setSigningIn] = useState<string | null>(null)
  const [biometricLoading, setBiometricLoading] = useState(false)

  const showBiometric = biometricSupport.available && biometricEnabled && !isFullFlowTesting()

  useEffect(() => {
    if (!showBiometric) return
    let cancelled = false
    const run = async () => {
      setBiometricLoading(true)
      await loginWithBiometrics()
      if (!cancelled) setBiometricLoading(false)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [showBiometric, loginWithBiometrics])

  const handleBiometricLogin = async () => {
    setBiometricLoading(true)
    await loginWithBiometrics()
    setBiometricLoading(false)
  }

  const handleTrainingLogin = async (loginId: string, type: 'phone' | 'email') => {
    setSigningIn(loginId)
    await login(type, loginId, TRAINING_PASSWORD)
    setSigningIn(null)
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.hero}>
        <AppLogoMark size={56} style={styles.logo} />
        <Text style={styles.title}>{toTitleCase('Dry Laundry, Rain or Shine')}</Text>
        <Text style={styles.tagline}>
          {toTitleCase(`Book a neighbor's dryer anywhere in ${ACTIVE_REGION_LABEL} — free for the community.`)}
        </Text>
      </View>

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

      <PrimaryButton title="Log in" icon="log-in" onPress={() => navigateAuth('login')} full />
      <View style={styles.gap} />
      <OutlineButton title="Create account" icon="user-plus" onPress={() => navigateAuth('signup')} full />

      <View style={styles.training}>
        <View style={styles.trainingTitleRow}>
          <AppIcon name="users" size={14} color={colors.gray600} />
          <Text style={styles.trainingTitle}>
            {toTitleCase(`Training accounts · password ${TRAINING_PASSWORD}`)}
          </Text>
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
        <View style={styles.demoSteps}>
          {TRAINING_DEMO_STEPS.map((step) => (
            <Text key={step} style={styles.demoStep}>
              · {toTitleCase(step)}
            </Text>
          ))}
        </View>
      </View>
    </Screen>
  )
}
