import { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { OutlineButton, Screen } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import { useAdminDashboardData } from '../../hooks/useAdminDashboardData'
import { toTitleCase } from '../../lib/titleCase'
import { createAdminStyles } from './adminStyles'

type Props = {
  refreshKey?: number
}

export function AdminVerificationCodesScreen({ refreshKey }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createAdminStyles(colors), [colors])
  const { loading, codes, codeCounts, reload } = useAdminDashboardData(refreshKey)

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {toTitleCase('Pre-loaded 6-digit WhatsApp codes for phone verification.')}
        </Text>

        <View style={styles.card}>
          {loading ? (
            <Text style={styles.cardMeta}>{toTitleCase('Loading…')}</Text>
          ) : (
            codes.slice(0, 20).map((entry) => (
              <View key={entry.code} style={styles.codeRow}>
                <Text style={styles.codeValue}>{entry.code}</Text>
                <Text style={styles.codeMeta} numberOfLines={2}>
                  {entry.status}
                  {entry.assignedUserName ? ` · ${entry.assignedUserName}` : ''}
                </Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.hint}>
          {toTitleCase(
            `${codeCounts.available} codes available · ${codeCounts.assigned} assigned · ${codeCounts.used} used`,
          )}
        </Text>

        <OutlineButton
          title="Refresh codes"
          icon="rotate-cw"
          onPress={() => void reload()}
          full
        />
      </ScrollView>
    </Screen>
  )
}
