import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'
import type { Screen as AppScreen } from '../../types'

type LegalSection = { title: string; body: string }

type Props = {
  title: string
  subtitle: string
  sections: readonly LegalSection[]
  backScreen?: AppScreen
  backLabel?: string
}

export function LegalDocumentScreen({
  title,
  subtitle,
  sections,
  backScreen = 'help',
  backLabel = 'Help',
}: Props) {
  const { navigate } = useApp()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Screen>
      <BackButton onPress={() => navigate(backScreen)} label={backLabel} />
      <View style={styles.titleRow}>
        <AppIcon name="file-text" size={22} />
        <Text style={styles.title}>{toTitleCase(title)}</Text>
      </View>
      <Text style={styles.subtitle}>{toTitleCase(subtitle)}</Text>

      <View style={styles.card}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{toTitleCase(section.title)}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </View>
    </Screen>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    title: { fontSize: 26, fontWeight: '700', lineHeight: 32, color: colors.black },
    subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
    card: {
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.lg,
      backgroundColor: colors.white,
    },
    section: { gap: spacing.sm },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.black, lineHeight: 22 },
    sectionBody: { fontSize: 14, color: colors.gray600, lineHeight: 21 },
  })
}
