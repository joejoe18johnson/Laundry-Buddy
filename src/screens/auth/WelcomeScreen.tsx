import { Image, Platform, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { TRAINING_ACCOUNTS, TRAINING_PASSWORD, ACTIVE_REGION_LABEL } from '../../data/seedData'
import { OutlineButton, PrimaryButton, Screen } from '../../components/ui'
import { colors } from '../../theme'

export function WelcomeScreen() {
  const { navigateAuth } = useAuth()

  return (
    <Screen style={styles.container}>
      <View style={styles.hero}>
        <Image source={require('../../../assets/splash-icon.png')} style={styles.logoMark} accessibilityLabel="Laundry Buddy logo" />
        <Text style={styles.logo}>Laundry Buddy</Text>
        <Text style={styles.title}>Dry laundry, rain or shine</Text>
        <Text style={styles.tagline}>
          Book a neighbor's dryer in the {ACTIVE_REGION_LABEL} — free for the community.
        </Text>
        <Text style={styles.regionNote}>More districts coming soon.</Text>
      </View>

      <PrimaryButton title="Log in" onPress={() => navigateAuth('login')} full />
      <View style={styles.gap} />
      <OutlineButton title="Create account" onPress={() => navigateAuth('signup')} full />

      <View style={styles.training}>
        <Text style={styles.trainingTitle}>Training accounts · password {TRAINING_PASSWORD}</Text>
        {TRAINING_ACCOUNTS.map((a) => (
          <View key={a.label} style={styles.trainingRow}>
            <Text style={styles.trainingName}>{a.label}</Text>
            <Text style={styles.trainingLogin}>{a.login}</Text>
          </View>
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  hero: { flex: 1, justifyContent: 'center', paddingVertical: 40 },
  logoMark: { width: 88, height: 88, marginBottom: 16 },
  logo: { fontSize: 18, fontWeight: '700', color: colors.accent, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5, marginBottom: 12 },
  tagline: { fontSize: 16, color: colors.gray500, lineHeight: 24 },
  regionNote: { fontSize: 13, color: colors.gray400, marginTop: 8, fontStyle: 'italic' },
  gap: { height: 12 },
  training: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  trainingTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray600,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  trainingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  trainingName: { fontSize: 13, fontWeight: '500', flex: 1 },
  trainingLogin: {
    fontSize: 12,
    color: colors.gray500,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
})
