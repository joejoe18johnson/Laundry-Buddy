import { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { OutlineButton, Screen } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import { useAdminDashboardData } from '../../hooks/useAdminDashboardData'
import { formatIdDocumentType, getIdentityVerification } from '../../lib/identityVerification'
import { toTitleCase } from '../../lib/titleCase'
import {
  createAdminStyles,
  formatAdminLogin,
  statusBadgeStyle,
  verificationStatusLabel,
} from './adminStyles'

type Props = {
  highlightUserId?: string
  refreshKey?: number
  onReviewUser: (userId: string) => void
}

export function AdminUsersScreen({ highlightUserId, refreshKey, onReviewUser }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createAdminStyles(colors), [colors])
  const { loading, users } = useAdminDashboardData(refreshKey)

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {toTitleCase('All guest and host accounts — open any profile to review verification.')}
        </Text>

        {loading ? (
          <Text style={styles.cardMeta}>{toTitleCase('Loading…')}</Text>
        ) : users.length === 0 ? (
          <Text style={styles.cardMeta}>{toTitleCase('No users found.')}</Text>
        ) : (
          users.map((entry) => {
            const verification = getIdentityVerification(entry)
            return (
              <View key={entry.id} style={[styles.card, highlightUserId === entry.id && styles.cardHighlighted]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{entry.name}</Text>
                    <Text style={styles.cardMeta}>
                      {entry.role === 'host' ? 'Host' : 'Guest'} · {formatAdminLogin(entry)}
                    </Text>
                    {verification.idType ? (
                      <Text style={styles.cardMeta}>{formatIdDocumentType(verification.idType)}</Text>
                    ) : null}
                  </View>
                  <View style={statusBadgeStyle(verification.status, styles)}>
                    <Text style={styles.badgeText}>
                      {verificationStatusLabel(verification.status, entry.role)}
                    </Text>
                  </View>
                </View>
                <OutlineButton title="Review user" icon="eye" onPress={() => onReviewUser(entry.id)} />
              </View>
            )
          })
        )}
      </ScrollView>
    </Screen>
  )
}
