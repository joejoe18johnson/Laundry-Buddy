import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useApp } from '../../context/AppContext'
import { BackButton, PrimaryButton, Screen } from '../../components/ui'
import { colors, radius, spacing } from '../../theme'

export function MarkDryScreen() {
  const { activeLoads, navigate, markDry } = useApp()
  const [photoTaken, setPhotoTaken] = useState(false)

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
      <Text style={styles.eyebrow}>Active load</Text>
      <Text style={styles.title}>{dryingLoad.customerName}'s laundry</Text>

      <Text style={styles.section}>Confirm it's dry</Text>
      <Text style={styles.sub}>Take a photo so the customer can trust it's ready.</Text>

      <Pressable
        onPress={() => setPhotoTaken(true)}
        style={[styles.upload, photoTaken && styles.uploadDone]}
      >
        <Text style={[styles.uploadText, photoTaken && styles.uploadTextDone]}>
          {photoTaken ? '✓ Photo added' : 'Add photo'}
        </Text>
      </Pressable>

      <PrimaryButton
        title="Mark as dry"
        onPress={() => markDry(dryingLoad.id)}
        disabled={!photoTaken}
        full
      />
      <Text style={styles.notify}>Sends: "Your load is dry! Ready for pickup."</Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.lg },
  eyebrow: { fontSize: 13, color: colors.gray500, textTransform: 'uppercase', marginTop: spacing.sm, letterSpacing: 0.4 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: spacing.lg, lineHeight: 30 },
  section: { fontSize: 20, fontWeight: '700', marginBottom: spacing.sm, lineHeight: 26 },
  sub: { fontSize: 14, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
  upload: {
    minHeight: 180,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  uploadDone: { borderStyle: 'solid', borderColor: colors.green, backgroundColor: colors.greenBg },
  uploadText: { fontSize: 16, fontWeight: '500', color: colors.gray500 },
  uploadTextDone: { color: colors.green },
  notify: { fontSize: 13, color: colors.gray500, textAlign: 'center', marginTop: spacing.md, lineHeight: 20 },
})
