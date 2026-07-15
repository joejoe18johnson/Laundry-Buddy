import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LoadPhotoCapture } from '../../components/LoadPhotoCapture'
import { useApp } from '../../context/AppContext'
import { BackButton, PrimaryButton, Screen } from '../../components/ui'
import { AppIcon } from '../../components/AppIcon'
import { colors, spacing } from '../../theme'

export function MarkDryScreen() {
  const { activeLoads, navigate, markDry } = useApp()
  const [photoUri, setPhotoUri] = useState<string | null>(null)

  const dryingLoad = activeLoads.find((l) => l.stage === 'drying')

  if (!dryingLoad) {
    return (
      <Screen style={styles.empty}>
        <Text style={styles.emptyTitle}>No load to mark dry</Text>
        <PrimaryButton title="Back to dashboard" onPress={() => navigate('host-dashboard')} full />
      </Screen>
    )
  }

  return (
    <Screen>
      <BackButton onPress={() => navigate('host-dashboard')} />
      <View style={styles.statusHeader}>
        <AppIcon name="package" size={16} color={colors.gray500} />
        <Text style={styles.eyebrow}>Active load</Text>
      </View>
      <Text style={styles.title}>{dryingLoad.customerName}'s laundry</Text>

      <View style={styles.sectionHeader}>
        <AppIcon name="check-circle" size={20} />
        <Text style={styles.section}>Confirm it's dry</Text>
      </View>
      <Text style={styles.sub}>Take a photo so the customer can trust it's ready.</Text>

      <LoadPhotoCapture photoUri={photoUri} onPhotoChange={setPhotoUri} />

      <View style={{ height: spacing.lg }} />

      <PrimaryButton
        title="Mark as dry"
        icon="wind"
        onPress={() => markDry(dryingLoad.id)}
        disabled={!photoUri}
        full
      />
      <View style={styles.notifyRow}>
        <AppIcon name="message-circle" size={14} color={colors.gray500} />
        <Text style={styles.notify}>Sends: "Your load is dry! Ready for pickup."</Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.lg },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  eyebrow: { fontSize: 13, color: colors.gray500, textTransform: 'capitalize', letterSpacing: 0.4 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: spacing.lg, lineHeight: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  section: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  sub: { fontSize: 14, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
  notifyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  notify: { fontSize: 13, color: colors.gray500, lineHeight: 20, flexShrink: 1 },
})
