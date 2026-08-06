import { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { OutlineButton, Screen } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import { useAdminDashboardData } from '../../hooks/useAdminDashboardData'
import { formatIdDocumentType, getIdentityVerification } from '../../lib/identityVerification'
import { toTitleCase } from '../../lib/titleCase'
import type { AdminUsersFilter } from './AdminOverviewScreen'
import {
  createAdminStyles,
  formatAdminLogin,
  statusBadgeStyle,
  verificationStatusLabel,
} from './adminStyles'

type Props = {
  highlightUserId?: string
  refreshKey?: number
  filter?: AdminUsersFilter
  onReviewUser: (userId: string) => void
}

export function AdminUsersScreen({ highlightUserId, refreshKey, filter = 'all', onReviewUser }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createAdminStyles(colors), [colors])
  const { loading, users } = useAdminDashboardData(refreshKey)

  const filteredUsers = useMemo(() => {
    if (filter === 'pending') {
      return users.filter((entry) => getIdentityVerification(entry).status === 'pending')
    }
    if (filter === 'verified') {
      return users.filter((entry) => getIdentityVerification(entry).status === 'verified')
    }
    return users
  }, [filter, users])

  const subtitle =
    filter === 'pending'
      ? 'Accounts still waiting on phone, ID, selfie, or address verification.'
      : filter === 'verified'
        ? 'Fully approved guest and host accounts.'
        : 'All guest and host accounts — open any profile to review verification.'

  const emptyLabel =
    filter === 'pending'
      ? 'No pending accounts.'
      : filter === 'verified'
        ? 'No verified accounts yet.'
        : 'No users found.'

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{toTitleCase(subtitle)}</Text>

        {loading ? (
          <Text style={styles.cardMeta}>{toTitleCase('Loading…')}</Text>
        ) : filteredUsers.length === 0 ? (
          <Text style={styles.cardMeta}>{toTitleCase(emptyLabel)}</Text>
        ) : (
          filteredUsers.map((entry) => {
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
