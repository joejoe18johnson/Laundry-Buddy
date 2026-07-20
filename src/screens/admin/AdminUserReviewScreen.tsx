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
import { useNotifications } from '../../context/NotificationContext'
import { useTheme } from '../../context/ThemeContext'
import { getAdminUserById } from '../../lib/adminUsers'
import {
  canAdminReviewAddress,
  canAdminReviewId,
  canAdminReviewSelfie,
  documentReviewStatusLabel,
  formatIdDocumentType,
  getAddressReviewStatus,
  getIdentityVerification,
  getIdReviewStatus,
  getSelfieReviewStatus,
  hasAddressProof,
  hasIdDocument,
  hasSelfie,
  isIdentityVerified,
  isPhoneVerificationComplete,
  verificationStatusLabel,
} from '../../lib/identityVerification'
import { deliverVerificationCodeViaWhatsApp } from '../../lib/adminVerificationDelivery'
import { buildVerificationApprovedBody, VERIFICATION_APPROVED_TITLE } from '../../lib/verificationCodes'
import { verificationApprovedLink } from '../../lib/notificationLinks'
import { getAssignedCodeForUser } from '../../lib/verificationCodeStorage'
import { getOpenVerificationCodeRequest } from '../../lib/verificationCodeService'
import {
  type VerificationCodeRequest,
} from '../../lib/verificationRequestStorage'
import { formatWhatsAppDisplay } from '../../lib/whatsapp'
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

function ReviewStatusBadge({ label }: { label: string }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={styles.reviewStatusBadge}>
      <Text style={styles.reviewStatusBadgeText}>{label}</Text>
    </View>
  )
}

function DocumentReviewActions({
  approveLabel,
  rejectLabel,
  canReview,
  phoneVerified,
  busy,
  onApprove,
  onReject,
  waitingLabel,
}: {
  approveLabel: string
  rejectLabel: string
  canReview: boolean
  phoneVerified: boolean
  busy: boolean
  onApprove: () => void
  onReject: () => void
  waitingLabel?: string
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (!canReview) {
    if (waitingLabel) {
      return <Text style={styles.emptyText}>{toTitleCase(waitingLabel)}</Text>
    }
    return null
  }

  return (
    <>
      {!phoneVerified ? (
        <Text style={styles.emptyText}>
          {toTitleCase('Phone must be verified via WhatsApp code before you can approve documents.')}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <SuccessButton
          title={approveLabel}
          icon="check"
          onPress={onApprove}
          disabled={busy || !phoneVerified}
        />
        <GhostButton
          title={busy ? 'Working…' : rejectLabel}
          icon="x"
          onPress={busy ? () => {} : onReject}
        />
      </View>
    </>
  )
}

export function AdminUserReviewScreen({ userId, onBack, onUpdated }: AdminUserReviewScreenProps) {
  const {
    adminApproveUserId,
    adminRejectUserId,
    adminApproveUserSelfie,
    adminRejectUserSelfie,
    adminApproveUserAddress,
    adminRejectUserAddress,
    adminSendVerificationCode,
  } = useAuth()
  const { push } = useNotifications()
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
      getOpenVerificationCodeRequest(userId),
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
  const phoneVerified = isPhoneVerificationComplete(user)
  const idReviewStatus = getIdReviewStatus(verification)
  const selfieReviewStatus = getSelfieReviewStatus(verification)
  const addressReviewStatus = getAddressReviewStatus(verification)
  const reviewId = canAdminReviewId(user)
  const reviewSelfie = canAdminReviewSelfie(user)
  const reviewAddress = canAdminReviewAddress(user)
  const canSendCode = codeRequest?.status === 'pending'

  const notifyIfFullyVerified = async (updatedUser: User | null) => {
    if (!updatedUser || !isIdentityVerified(updatedUser)) return
    const notifyRole = updatedUser.role === 'host' ? 'host' : 'customer'
    await push(
      userId,
      VERIFICATION_APPROVED_TITLE,
      buildVerificationApprovedBody(notifyRole),
      verificationApprovedLink(updatedUser.role),
    )
  }

  const runReviewAction = async (
    action: () => Promise<{ user: User | null; error?: string }>,
    successMessage: string,
  ) => {
    setBusy(true)
    setActionError(null)
    setActionMessage(null)
    const result = await action()
    if (!result.user) {
      setActionError(
        result.error ??
          'Could not update verification. Run the Supabase admin migration, then try again.',
      )
    } else {
      setActionMessage(successMessage)
      await notifyIfFullyVerified(result.user)
    }
    await reload()
    onUpdated?.()
    setBusy(false)
  }

  const handleSendCode = async () => {
    if (!codeRequest) return
    setBusy(true)
    setActionError(null)
    setActionMessage(null)
    const result = await deliverVerificationCodeViaWhatsApp({
      request: codeRequest,
      adminSendVerificationCode,
      push,
    })
    if (result.ok) {
      setActionMessage(result.instruction ?? 'Verification code sent.')
    } else {
      setActionError(result.error ?? 'Could not send verification code.')
    }
    await reload()
    onUpdated?.()
    setBusy(false)
  }

  const handleApproveId = () =>
    void runReviewAction(() => adminApproveUserId(userId), 'Government ID approved.')

  const handleRejectId = () =>
    void runReviewAction(() => adminRejectUserId(userId), 'Government ID rejected.')

  const handleApproveAddress = () =>
    void runReviewAction(() => adminApproveUserAddress(userId), 'Address proof approved.')

  const handleRejectAddress = () =>
    void runReviewAction(() => adminRejectUserAddress(userId), 'Address proof rejected.')

  const handleApproveSelfie = () =>
    void runReviewAction(() => adminApproveUserSelfie(userId), 'Verification selfie approved.')

  const handleRejectSelfie = () =>
    void runReviewAction(() => adminRejectUserSelfie(userId), 'Verification selfie rejected.')

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
            <DetailRow
              label="Phone verified"
              value={phoneVerified ? 'Yes — code entered in app' : 'Waiting for WhatsApp code'}
            />
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
                    title={busy ? 'Opening WhatsApp…' : 'Send code via WhatsApp'}
                    icon="message-circle"
                    full
                    disabled={busy}
                    onPress={() => void handleSendCode()}
                  />
                ) : codeRequest.status === 'code_sent' ? (
                  <Text style={styles.reviewHint}>
                    {toTitleCase('Code sent — waiting for the host to enter it in the app.')}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.emptyText}>{toTitleCase('No open phone code request.')}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{toTitleCase('ID verification')}</Text>
            {hasIdDocument(verification) ? (
              <ReviewStatusBadge label={documentReviewStatusLabel(idReviewStatus)} />
            ) : null}
          </View>
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
            <DocumentReviewActions
              approveLabel="Approve ID"
              rejectLabel="Reject ID"
              canReview={reviewId}
              phoneVerified={phoneVerified}
              busy={busy}
              onApprove={handleApproveId}
              onReject={handleRejectId}
              waitingLabel={
                hasIdDocument(verification) && idReviewStatus === 'approved'
                  ? 'Government ID approved.'
                  : hasIdDocument(verification) && idReviewStatus === 'rejected'
                    ? 'Government ID rejected.'
                    : undefined
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{toTitleCase('Selfie verification')}</Text>
            {hasSelfie(verification) ? (
              <ReviewStatusBadge label={documentReviewStatusLabel(selfieReviewStatus)} />
            ) : null}
          </View>
          <View style={styles.card}>
            <Text style={styles.reviewHint}>
              {toTitleCase('Compare this live selfie with the photo on the government ID above.')}
            </Text>
            {verification.selfiePhotoUri ? (
              <VerificationDocumentPreview
                uri={verification.selfiePhotoUri}
                label="Verification selfie"
                onViewImage={setLightboxUri}
              />
            ) : (
              <Text style={styles.emptyText}>{toTitleCase('No verification selfie uploaded yet.')}</Text>
            )}
            <DocumentReviewActions
              approveLabel="Approve selfie"
              rejectLabel="Reject selfie"
              canReview={reviewSelfie}
              phoneVerified={phoneVerified}
              busy={busy}
              onApprove={handleApproveSelfie}
              onReject={handleRejectSelfie}
              waitingLabel={
                hasSelfie(verification) && selfieReviewStatus === 'approved'
                  ? 'Verification selfie approved.'
                  : hasSelfie(verification) && selfieReviewStatus === 'rejected'
                    ? 'Verification selfie rejected.'
                    : undefined
              }
            />
          </View>
        </View>

        {user.role === 'host' ? (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>{toTitleCase('Address verification')}</Text>
              {hasAddressProof(verification) ? (
                <ReviewStatusBadge label={documentReviewStatusLabel(addressReviewStatus)} />
              ) : null}
            </View>
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
              <DocumentReviewActions
                approveLabel="Approve address"
                rejectLabel="Reject address"
                canReview={reviewAddress}
                phoneVerified={phoneVerified}
                busy={busy}
                onApprove={handleApproveAddress}
                onReject={handleRejectAddress}
                waitingLabel={
                  hasAddressProof(verification) && addressReviewStatus === 'approved'
                    ? 'Address proof approved.'
                    : hasAddressProof(verification) && addressReviewStatus === 'rejected'
                      ? 'Address proof rejected.'
                      : undefined
                }
              />
            </View>
          </View>
        ) : null}

        {verification.status === 'pending' &&
        (idReviewStatus === 'approved' ||
          selfieReviewStatus === 'approved' ||
          addressReviewStatus === 'approved') ? (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.reviewHint}>
                {toTitleCase(
                  user.role === 'host'
                    ? 'Some documents are approved — finish reviewing ID, selfie, and address to fully verify this host.'
                    : 'Some documents are approved — finish reviewing ID and selfie to fully verify this guest.',
                )}
              </Text>
            </View>
          </View>
        ) : null}

        {verification.status === 'verified' ? (
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
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.gray600,
      letterSpacing: 0.4,
      flex: 1,
    },
    reviewStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.gray100,
    },
    reviewStatusBadgeText: { fontSize: 10, fontWeight: '700', color: colors.gray600 },
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
