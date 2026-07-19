import { useMemo, useState } from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { OutlineButton, PrimaryButton, Screen } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useAdminDashboardData } from '../../hooks/useAdminDashboardData'
import { formatIdDocumentType, getIdentityVerification } from '../../lib/identityVerification'
import { buildWhatsAppVerificationCodeMessage } from '../../lib/verificationCodes'
import { openWhatsAppVerificationCode } from '../../lib/whatsapp'
import { toTitleCase } from '../../lib/titleCase'
import type { VerificationCodeRequest } from '../../lib/verificationRequestStorage'
import { createAdminStyles } from './adminStyles'

type Props = {
  highlightUserId?: string
  refreshKey?: number
  onReviewUser: (userId: string) => void
}

export function AdminVerificationQueueScreen({ highlightUserId, refreshKey, onReviewUser }: Props) {
  const { adminSendVerificationCode } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createAdminStyles(colors), [colors])
  const { loading, codeRequests, idReviewUsers, queueCount, reload } = useAdminDashboardData(refreshKey)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleSendCode = async (request: VerificationCodeRequest) => {
    setBusyUserId(request.userId)
    setActionError(null)
    const result = await adminSendVerificationCode(request.userId)
    if (result.ok && result.code) {
      const message = buildWhatsAppVerificationCodeMessage(request.userName, result.code)
      openWhatsAppVerificationCode(request.phone, message)
    } else {
      const message = result.error ?? 'Could not send verification code.'
      setActionError(message)
      Alert.alert('Could not send code', message)
    }
    await reload()
    setBusyUserId(null)
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {toTitleCase('Phone code requests and document reviews waiting for support.')}
        </Text>

        {actionError ? (
          <View style={styles.banner}>
            <AppIcon name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.bannerText}>{actionError}</Text>
          </View>
        ) : null}

        {loading ? (
          <Text style={styles.cardMeta}>{toTitleCase('Loading…')}</Text>
        ) : queueCount === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardMeta}>{toTitleCase('No open verification requests.')}</Text>
          </View>
        ) : (
          <>
            {codeRequests.map((request) => (
              <View
                key={request.id}
                style={[styles.card, highlightUserId === request.userId && styles.cardHighlighted]}
              >
                <Text style={styles.queueType}>{toTitleCase('Phone code request')}</Text>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{request.userName}</Text>
                    <Text style={styles.cardMeta}>{request.phone}</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <PrimaryButton
                    title={busyUserId === request.userId ? 'Opening WhatsApp…' : 'Send via WhatsApp'}
                    icon="message-circle"
                    onPress={() => void handleSendCode(request)}
                    disabled={busyUserId === request.userId}
                  />
                  <OutlineButton title="Review" icon="eye" onPress={() => onReviewUser(request.userId)} />
                </View>
              </View>
            ))}

            {idReviewUsers.map((entry) => (
              <View
                key={entry.id}
                style={[styles.card, highlightUserId === entry.id && styles.cardHighlighted]}
              >
                <Text style={styles.queueType}>
                  {entry.role === 'host' ? toTitleCase('Host verification review') : toTitleCase('ID review')}
                </Text>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{entry.name}</Text>
                    <Text style={styles.cardMeta}>
                      {entry.role === 'host' ? 'Host' : 'Guest'} ·{' '}
                      {getIdentityVerification(entry).idType
                        ? formatIdDocumentType(getIdentityVerification(entry).idType)
                        : 'Document uploaded'}
                    </Text>
                  </View>
                </View>
                <OutlineButton
                  title={entry.role === 'host' ? 'Review host verification' : 'Review & approve ID'}
                  icon="eye"
                  onPress={() => onReviewUser(entry.id)}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  )
}
