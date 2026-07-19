import { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { ImageLightbox } from '../../components/ImageLightbox'
import { VerificationDocumentPreview } from '../../components/VerificationDocumentPreview'
import {
  BackButton,
  GhostButton,
  OutlineButton,
  PrimaryButton,
  Screen,
  SuccessButton,
} from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { getAdminUserById } from '../../lib/adminUsers'
import {
  formatIdDocumentType,
  getIdentityVerification,
  hasAddressProof,
  verificationStatusLabel,
} from '../../lib/identityVerification'
import { buildWhatsAppVerificationCodeMessage } from '../../lib/verificationCodes'
import { getAssignedCodeForUser } from '../../lib/verificationCodeStorage'
import {
  getVerificationCodeRequestForUser,
  type VerificationCodeRequest,
} from '../../lib/verificationRequestStorage'
import { formatWhatsAppDisplay, openWhatsAppVerificationCode } from '../../lib/whatsapp'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'
import type { User } from '../../types'

type AdminUserReviewScreenProps = {
  userId: string
  onBack: () => void
  onUpdated?: () => void
}

function formatLogin(user: User): string {
  if (user.email) return user.email
  if (user.phone) return user.phone.replace(/^501/, '')
  return user.id
}

function formatWhen(iso?: string): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleString()
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{toTitleCase(label)}</Text>
      <Text style={[styles.detailValue, mono && styles.detailMono]}>{value}</Text>
    </View>
  )
}

export function AdminUserReviewScreen({ userId, onBack, onUpdated }: AdminUserReviewScreenProps) {
  const { adminApproveUser, adminRejectUser, adminSendVerificationCode } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [user, setUser] = useState<User | null>(null)
  const [codeRequest, setCodeRequest] = useState<VerificationCodeRequest | null>(null)
  const [assignedCode, setAssignedCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [lightboxUri, setLightboxUri] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    const [nextUser, request, codeRecord] = await Promise.all([
      getAdminUserById(userId),
      getVerificationCodeRequestForUser(userId),
      getAssignedCodeForUser(userId),
    ])
    setUser(nextUser)
    setCodeRequest(request)
    setAssignedCode(codeRecord?.code ?? request?.assignedCode ?? null)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void reload()
  }, [reload])

  if (loading || !user) {
    return (
      <Screen>
        <BackButton onPress={onBack} label="Dashboard" />
        <Text style={styles.loadingText}>{toTitleCase(loading ? 'Loading…' : 'User not found')}</Text>
      </Screen>
    )
  }

  const verification = getIdentityVerification(user)
  const canReviewId =
    verification.status === 'pending' &&
    verification.idUploaded &&
    (user.role !== 'host' || hasAddressProof(verification))
  const canSendCode = codeRequest?.status === 'pending'

  const handleSendCode = async () => {
    if (!codeRequest) return
    setBusy(true)
    setActionError(null)
    setActionMessage(null)
    const result = await adminSendVerificationCode(userId)
    if (result.ok && result.code) {
      const message = buildWhatsAppVerificationCodeMessage(user.name, result.code)
      openWhatsAppVerificationCode(codeRequest.phone, message)
      setActionMessage('Verification code sent. WhatsApp should open with the message ready.')
    } else {
      setActionError(result.error ?? 'Could not send verification code.')
    }
    await reload()
    onUpdated?.()
    setBusy(false)
  }

  const handleApprove = async () => {
    setBusy(true)
    setActionError(null)
    setActionMessage(null)
    const updated = await adminApproveUser(userId)
    if (!updated) {
      setActionError('Could not approve this user. Try refreshing the dashboard.')
    } else {
      setActionMessage('User verification approved.')
    }
    await reload()
    onUpdated?.()
    setBusy(false)
  }

  const handleReject = async () => {
    setBusy(true)
    setActionError(null)
    setActionMessage(null)
    const updated = await adminRejectUser(userId)
    if (!updated) {
      setActionError('Could not reject this user. Try refreshing the dashboard.')
    } else {
      setActionMessage('User verification rejected.')
    }
    await reload()
    onUpdated?.()
    setBusy(false)
  }

  return (
    <Screen>
      <BackButton onPress={onBack} label="Dashboard" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{user.name}</Text>
            <Text style={styles.subtitle}>
              {user.role === 'host' ? 'Host' : 'Guest'} · {formatLogin(user)}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{verificationStatusLabel(verification.status, user.role)}</Text>
          </View>
        </View>

        {actionError ? (
          <View style={[styles.banner, styles.bannerError]}>
            <AppIcon name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.bannerErrorText}>{actionError}</Text>
          </View>
        ) : null}
        {actionMessage ? (
          <View style={[styles.banner, styles.bannerSuccess]}>
            <AppIcon name="check-circle" size={16} color={colors.green} />
            <Text style={styles.bannerSuccessText}>{actionMessage}</Text>
          </View>
        ) : null}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{toTitleCase('Account details')}</Text>
          <View style={styles.card}>
            <DetailRow label="Phone" value={verification.verifiedPhone ?? user.phone ?? '—'} />
            <DetailRow label="Email" value={user.email ?? '—'} />
            <DetailRow label="Submitted" value={formatWhen(verification.submittedAt) ?? '—'} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{toTitleCase('Phone verification')}</Text>
          <View style={styles.card}>
            {codeRequest ? (
              <>
                <DetailRow
                  label="Code request"
                  value={codeRequest.status === 'pending' ? 'Waiting to send' : 'Sent via WhatsApp'}
                />
                <DetailRow label="WhatsApp number" value={formatWhatsAppDisplay(codeRequest.phone)} />
                {assignedCode ? <DetailRow label="Assigned code" value={assignedCode} mono /> : null}
                {canSendCode ? (
                  <PrimaryButton
                    title={busy ? 'Opening WhatsApp…' : 'Send via WhatsApp'}
                    icon="message-circle"
                    full
                    disabled={busy}
                    onPress={() => void handleSendCode()}
                  />
                ) : null}
              </>
            ) : (
              <Text style={styles.emptyText}>{toTitleCase('No open phone code request.')}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{toTitleCase('ID verification')}</Text>
          <View style={styles.card}>
            <DetailRow
              label="Document type"
              value={verification.idType ? formatIdDocumentType(verification.idType) : 'Not selected'}
            />
            {verification.idPhotoUri ? (
              <VerificationDocumentPreview
                uri={verification.idPhotoUri}
                label="Government ID"
                onViewImage={setLightboxUri}
              />
            ) : (
              <Text style={styles.emptyText}>{toTitleCase('No ID document uploaded yet.')}</Text>
            )}
          </View>
        </View>

        {user.role === 'host' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{toTitleCase('Address verification')}</Text>
            <View style={styles.card}>
              {verification.address ? <DetailRow label="Listed address" value={verification.address} /> : null}
              {verification.addressProofUri ? (
                <VerificationDocumentPreview
                  uri={verification.addressProofUri}
                  mimeType={verification.addressProofMimeType}
                  name={verification.addressProofName}
                  label="Utility bill or lease"
                  onViewImage={setLightboxUri}
                />
              ) : (
                <Text style={styles.emptyText}>{toTitleCase('No address proof uploaded yet.')}</Text>
              )}
            </View>
          </View>
        ) : null}

        {canReviewId ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{toTitleCase('Review decision')}</Text>
            <View style={styles.card}>
              <Text style={styles.reviewHint}>
                {toTitleCase(
                  user.role === 'host'
                    ? 'Review the ID and address proof above, then approve or reject this verification.'
                    : 'Review the document above, then approve or reject this verification.',
                )}
              </Text>
              <View style={styles.actions}>
                <SuccessButton
                  title="Approve ID"
                  icon="check"
                  onPress={() => void handleApprove()}
                  disabled={busy}
                />
                <GhostButton
                  title={busy ? 'Working…' : 'Reject ID'}
                  icon="x"
                  onPress={busy ? () => {} : () => void handleReject()}
                />
              </View>
            </View>
          </View>
        ) : verification.status === 'verified' ? (
          <View style={styles.section}>
            <View style={[styles.card, styles.approvedCard]}>
              <AppIcon name="check-circle" size={20} color={colors.green} />
              <Text style={styles.approvedText}>{toTitleCase('This user is verified.')}</Text>
            </View>
          </View>
        ) : verification.status === 'rejected' ? (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.emptyText}>
                {toTitleCase('Verification was rejected. User can resubmit from Verification Center.')}
              </Text>
            </View>
          </View>
        ) : null}

        <OutlineButton title="Refresh" icon="rotate-cw" onPress={() => void reload()} full />
      </ScrollView>

      <ImageLightbox visible={!!lightboxUri} imageUri={lightboxUri} onClose={() => setLightboxUri(null)} />
    </Screen>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    loadingText: { fontSize: 15, color: colors.gray500, marginTop: spacing.lg },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    title: { fontSize: 26, fontWeight: '700', color: colors.black },
    subtitle: { fontSize: 14, color: colors.gray500, marginTop: 4 },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.gray100,
    },
    statusBadgeText: { fontSize: 11, fontWeight: '700', color: colors.gray600 },
    section: { marginBottom: spacing.lg },
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
      backgroundColor: colors.white,
      gap: spacing.sm,
    },
    approvedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.greenBg,
      borderColor: colors.green,
    },
    approvedText: { fontSize: 14, fontWeight: '600', color: colors.green, flex: 1 },
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    bannerError: { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.danger },
    bannerErrorText: { flex: 1, fontSize: 13, color: colors.danger, lineHeight: 18 },
    bannerSuccess: { backgroundColor: colors.greenBg, borderWidth: 1, borderColor: colors.green },
    bannerSuccessText: { flex: 1, fontSize: 13, color: colors.green, lineHeight: 18, fontWeight: '600' },
    detailRow: { gap: 2 },
    detailLabel: { fontSize: 11, fontWeight: '700', color: colors.gray500, letterSpacing: 0.3 },
    detailValue: { fontSize: 14, color: colors.black, lineHeight: 20 },
    detailMono: { fontFamily: 'Menlo', letterSpacing: 1 },
    emptyText: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
    reviewHint: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  })
}
