import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LoadPhotoCapture } from '../../components/LoadPhotoCapture'
import { LoadListBreakdown } from '../../components/LoadListBreakdown'
import { useApp } from '../../context/AppContext'
import { BackButton, PrimaryButton, Screen } from '../../components/ui'
import { AppIcon } from '../../components/AppIcon'
import { toTitleCase } from '../../lib/titleCase'
import { colors, spacing } from '../../theme'

export function MarkDryScreen() {
  const { activeLoads, navigate, markDry, markDryLoadId } = useApp()
  const [photoUri, setPhotoUri] = useState<string | null>(null)

  const dryingLoad =
    activeLoads.find((load) => load.id === markDryLoadId && load.stage === 'drying') ??
    activeLoads.find((load) => load.stage === 'drying')

  if (!dryingLoad) {
    return (
      <Screen style={styles.empty}>
        <Text style={styles.emptyTitle}>{toTitleCase('No load to mark dry')}</Text>
        <PrimaryButton title="Back to dashboard" onPress={() => navigate('host-dashboard')} full />
      </Screen>
    )
  }

  return (
    <Screen>
      <BackButton onPress={() => navigate('host-dashboard')} />
      <View style={styles.statusHeader}>
        <AppIcon name="package" size={16} color={colors.gray500} />
        <Text style={styles.eyebrow}>{toTitleCase('Active load')}</Text>
      </View>
      <Text style={styles.title}>{dryingLoad.customerName}'s laundry</Text>

      {dryingLoad.clothesList && dryingLoad.clothesList.length > 0 ? (
        <View style={styles.loadListSection}>
          <LoadListBreakdown items={dryingLoad.clothesList} title="Guest's load list" />
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <AppIcon name="check-circle" size={20} />
        <Text style={styles.section}>{toTitleCase("Confirm it's dry")}</Text>
      </View>
      <Text style={styles.sub}>{toTitleCase("Take a photo so the guest can trust it's ready.")}</Text>

      <LoadPhotoCapture photoUri={photoUri} onPhotoChange={setPhotoUri} />

      <View style={{ height: spacing.lg }} />

      <PrimaryButton
        title="Mark as dry"
        icon="wind"
        onPress={() => markDry(dryingLoad.id, photoUri ?? undefined)}
        disabled={!photoUri}
        full
      />
      <View style={styles.notifyRow}>
        <AppIcon name="message-circle" size={14} color={colors.gray500} />
        <Text style={styles.notify}>{toTitleCase('Sends: "Your load is dry! Ready for pickup."')}</Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.lg },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  eyebrow: { fontSize: 13, color: colors.gray500, letterSpacing: 0.4 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: spacing.lg, lineHeight: 30 },
  loadListSection: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  section: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  sub: { fontSize: 14, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
  notifyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  notify: { fontSize: 13, color: colors.gray500, lineHeight: 20, flexShrink: 1 },
})
