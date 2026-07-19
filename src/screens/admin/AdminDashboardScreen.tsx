import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { OutlineButton, PrimaryButton, Screen } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { usersPendingIdReview } from '../../lib/adminUsers'
import {
  formatIdDocumentType,
  getIdentityVerification,
  verificationStatusLabel,
} from '../../lib/identityVerification'
import {
  countCodesByStatus,
  getAllVerificationCodes,
  type VerificationCodeRecord,
} from '../../lib/verificationCodeStorage'
import { buildWhatsAppVerificationCodeMessage } from '../../lib/verificationCodes'
import { getPendingVerificationCodeRequests, type VerificationCodeRequest } from '../../lib/verificationRequestStorage'
import { openWhatsAppVerificationCode } from '../../lib/whatsapp'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'
import type { User } from '../../types'

type AdminDashboardScreenProps = {
  highlightUserId?: string
  refreshKey?: number
  onReviewUser: (userId: string) => void
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    title: { fontSize: 26, fontWeight: '700', color: colors.black, flex: 1 },
    subtitle: { fontSize: 14, color: colors.gray500, lineHeight: 20, marginBottom: spacing.lg },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    statCard: {
      flexGrow: 1,
      minWidth: '45%',
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: colors.white,
    },
    statValue: { fontSize: 22, fontWeight: '700', color: colors.black },
    statLabel: { fontSize: 12, color: colors.gray500, marginTop: 4 },
    section: { marginBottom: spacing.xl },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.gray600,
      letterSpacing: 0.4,
      marginBottom: spacing.sm,
    },
    card: {
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: colors.white,
      gap: spacing.sm,
    },
    cardHighlighted: { borderColor: colors.black, backgroundColor: colors.gray50 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
    cardName: { fontSize: 16, fontWeight: '600', color: colors.black },
    cardMeta: { fontSize: 12, color: colors.gray500, lineHeight: 18 },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.gray100,
    },
    badgePending: { backgroundColor: colors.gray75 },
    badgeVerified: { backgroundColor: colors.greenBg },
    badgeText: { fontSize: 11, fontWeight: '700', color: colors.gray600 },
    queueType: { fontSize: 11, fontWeight: '700', color: colors.gray600, letterSpacing: 0.3 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray100,
    },
    codeValue: {
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 2,
      color: colors.black,
      fontVariant: ['tabular-nums'],
    },
    codeMeta: { fontSize: 12, color: colors.gray500, textAlign: 'right', flex: 1, marginLeft: spacing.md },
    hint: {
      fontSize: 12,
      color: colors.gray500,
      lineHeight: 18,
      marginTop: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.gray50,
      borderRadius: radius.md,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.gray50,
      borderWidth: 1,
      borderColor: colors.danger,
      marginBottom: spacing.md,
    },
    bannerText: { flex: 1, fontSize: 13, color: colors.danger, lineHeight: 18 },
  })
}

function statusBadgeStyle(status: string, styles: ReturnType<typeof createStyles>) {
  if (status === 'verified') return [styles.badge, styles.badgeVerified]
  if (status === 'pending') return [styles.badge, styles.badgePending]
  return styles.badge
}

function formatLogin(user: User): string {
  if (user.email) return user.email
  if (user.phone) return user.phone.replace(/^501/, '')
  return user.id
}

export function AdminDashboardScreen({
  highlightUserId,
  refreshKey,
  onReviewUser,
}: AdminDashboardScreenProps) {
  const { adminListUsers, adminSendVerificationCode } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [users, setUsers] = useState<User[]>([])
  const [codeRequests, setCodeRequests] = useState<VerificationCodeRequest[]>([])
  const [codes, setCodes] = useState<VerificationCodeRecord[]>([])
  const [codeCounts, setCodeCounts] = useState({ available: 0, assigned: 0, used: 0 })
  const [loading, setLoading] = useState(true)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    const [nextUsers, nextRequests, nextCodes, counts] = await Promise.all([
      adminListUsers(),
      getPendingVerificationCodeRequests(),
      getAllVerificationCodes(),
      countCodesByStatus(),
    ])
    setUsers(nextUsers.filter((entry) => entry.role !== 'admin'))
    setCodeRequests(nextRequests)
    setCodes(nextCodes)
    setCodeCounts(counts)
    setLoading(false)
  }, [adminListUsers])

  useEffect(() => {
    void reload()
  }, [reload, refreshKey])

  const idReviewUsers = useMemo(() => usersPendingIdReview(users), [users])
  const pendingUsers = users.filter((entry) => getIdentityVerification(entry).status === 'pending')
  const verifiedCount = users.filter((entry) => getIdentityVerification(entry).status === 'verified').length
  const queueCount = codeRequests.length + idReviewUsers.length

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

  const renderUserRow = (entry: User, highlighted = false) => {
    const verification = getIdentityVerification(entry)
    return (
      <View key={entry.id} style={[styles.card, highlighted && styles.cardHighlighted]}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{entry.name}</Text>
            <Text style={styles.cardMeta}>
              {entry.role === 'host' ? 'Host' : 'Guest'} · {formatLogin(entry)}
            </Text>
            {verification.idType ? (
              <Text style={styles.cardMeta}>{formatIdDocumentType(verification.idType)}</Text>
            ) : null}
          </View>
          <View style={statusBadgeStyle(verification.status, styles)}>
            <Text style={styles.badgeText}>{verificationStatusLabel(verification.status, entry.role)}</Text>
          </View>
        </View>
        <OutlineButton title="Review user" icon="eye" onPress={() => onReviewUser(entry.id)} />
      </View>
    )
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {toTitleCase('Review verification requests, view documents, and approve or reject users.')}
        </Text>

        {actionError ? (
          <View style={styles.banner}>
            <AppIcon name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.bannerText}>{actionError}</Text>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{queueCount}</Text>
            <Text style={styles.statLabel}>Open requests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingUsers.length}</Text>
            <Text style={styles.statLabel}>Pending verify</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{verifiedCount}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>All users</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{toTitleCase('Verification queue')}</Text>
          {loading ? (
            <Text style={styles.cardMeta}>{toTitleCase('Loading…')}</Text>
          ) : queueCount === 0 ? (
            <Text style={styles.cardMeta}>{toTitleCase('No open verification requests.')}</Text>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{toTitleCase('All users')}</Text>
          {users.map((entry) => renderUserRow(entry, highlightUserId === entry.id))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{toTitleCase('Verification codes (6-digit)')}</Text>
          <View style={styles.card}>
            {codes.slice(0, 12).map((entry) => (
              <View key={entry.code} style={styles.codeRow}>
                <Text style={styles.codeValue}>{entry.code}</Text>
                <Text style={styles.codeMeta} numberOfLines={2}>
                  {entry.status}
                  {entry.assignedUserName ? ` · ${entry.assignedUserName}` : ''}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.hint}>
            {toTitleCase(
              `${codeCounts.available} codes available · ${codeCounts.assigned} assigned · ${codeCounts.used} used`,
            )}
          </Text>
          <OutlineButton title="Refresh dashboard" icon="rotate-cw" onPress={() => { setActionError(null); void reload() }} full />
        </View>
      </ScrollView>
    </Screen>
  )
}
