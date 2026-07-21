import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useApp } from '../../context/AppContext'
import { PrimaryButton, Screen } from '../../components/ui'
import { toTitleCase } from '../../lib/titleCase'
import { spacing } from '../../theme'

/** Legacy route — forwards to the Dryer tab where mark-dry now lives. */
export function MarkDryScreen() {
  const { navigate, markDryExpandedLoadId } = useApp()

  useEffect(() => {
    navigate('host-dryer')
  }, [markDryExpandedLoadId, navigate])

  return (
    <Screen style={styles.empty}>
      <Text style={styles.emptyTitle}>{toTitleCase('Opening dryer…')}</Text>
      <PrimaryButton title="Go to dryer" onPress={() => navigate('host-dryer')} full />
    </Screen>
  )
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.lg },
})
