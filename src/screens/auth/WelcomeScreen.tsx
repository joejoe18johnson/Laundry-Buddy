import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { ACTIVE_REGION_LABEL } from '../../data/seedData'
import { toTitleCase } from '../../lib/titleCase'
import { AppLogoMark } from '../../components/AppLogoMark'
import { OutlineButton, PrimaryButton, Screen } from '../../components/ui'
import { spacing } from '../../theme'

function createWelcomeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flexGrow: 1 },
    hero: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xxl, alignItems: 'center' },
    logo: { marginBottom: spacing.lg },
    title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5, marginBottom: spacing.md, lineHeight: 40, textAlign: 'center' },
    tagline: { fontSize: 16, color: colors.gray500, lineHeight: 26, textAlign: 'center' },
    gap: { height: spacing.md },
    error: {
      marginTop: spacing.sm,
      color: colors.danger,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
    },
  })
}

export function WelcomeScreen() {
  const { navigateAuth, authError } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createWelcomeStyles(colors), [colors])

  return (
    <Screen style={styles.container}>
      <View style={styles.hero}>
        <AppLogoMark size={56} style={styles.logo} />
        <Text style={styles.title}>{toTitleCase('Dry Laundry, Rain or Shine')}</Text>
        <Text style={styles.tagline}>
          {toTitleCase(`Book a neighbor's dryer anywhere in ${ACTIVE_REGION_LABEL} — free for the community.`)}
        </Text>
      </View>

      <PrimaryButton title="Log in" icon="log-in" onPress={() => navigateAuth('login')} full />
      <View style={styles.gap} />
      <OutlineButton title="Create account" icon="user-plus" onPress={() => navigateAuth('signup')} full />

      {authError ? <Text style={styles.error}>{authError}</Text> : null}
    </Screen>
  )
}
