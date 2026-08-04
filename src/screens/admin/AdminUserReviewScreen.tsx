import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
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
import { usersStuckPendingVerification } from '../../lib/adminUsers'
import { deliverVerificationCodeToUser } from '../../lib/adminVerificationDelivery'
import {
  buildVerificationApprovedBody,
  buildVerificationDocApprovedBody,
  buildVerificationRejectedBody,
  VERIFICATION_APPROVED_TITLE,
  VERIFICATION_DOC_APPROVED_TITLE,
  VERIFICATION_REJECTED_TITLE,
  type VerificationDocumentKind,
} from '../../lib/verificationCodes'
import { identityVerificationLink, verificationApprovedLink } from '../../lib/notificationLinks'
import { getAssignedCodeForUser } from '../../lib/verificationCodeStorage'
import { getOpenVerificationCodeRequest } from '../../lib/verificationCodeService'
import {
  type VerificationCodeRequest,
} from '../../lib/verificationRequestStorage'
import { formatPhoneDisplay } from '../../lib/whatsapp'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'
import type { DocumentReviewStatus, User } from '../../types'

type AdminStepState = 'complete' | 'action_needed' | 'missing' | 'rejected'

function documentStepState(
  hasDocument: boolean,
  status: DocumentReviewStatus | 'none',
): AdminStepState {
  if (status === 'approved') return 'complete'
  if (status === 'rejected') return 'rejected'
  if (!hasDocument) return 'missing'
  if (status === 'pending') return 'action_needed'
  return 'missing'
}

function phoneStepState(phoneVerified: boolean, codeRequest: VerificationCodeRequest | null): AdminStepState {
  if (phoneVerified) return 'complete'
  if (codeRequest?.status === 'code_sent') return 'action_needed'
  if (codeRequest) return 'action_needed'
  return 'missing'
}

function stepStateLabel(state: AdminStepState): string {
  if (state === 'complete') return 'Complete'
  if (state === 'rejected') return 'Rejected'
  if (state === 'action_needed') return 'Action needed'
  return 'Not done'
}

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

function ReviewStatusBadge({
  label,
  state,
}: {
  label: string
  state?: AdminStepState
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const tone =
    state === 'complete'
      ? styles.badgeComplete
      : state === 'rejected' || state === 'missing'
        ? styles.badgeAttention
        : state === 'action_needed'
          ? styles.badgePending
          : styles.reviewStatusBadge
  const textTone =
    state === 'complete'
      ? styles.badgeCompleteText
      : state === 'rejected' || state === 'missing'
        ? styles.badgeAttentionText
        : state === 'action_needed'
          ? styles.badgePendingText
          : styles.reviewStatusBadgeText

  return (
    <View style={[styles.reviewStatusBadge, tone]}>
      <Text style={[styles.reviewStatusBadgeText, textTone]}>{label}</Text>
    </View>
  )
}

function StepStatusMessage({
  state,
  children,
}: {
  state: AdminStepState
  children: string
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const style =
    state === 'complete'
      ? styles.completeText
      : state === 'rejected' || state === 'missing'
        ? styles.attentionText
        : state === 'action_needed'
          ? styles.pendingText
          : styles.emptyText

  return <Text style={style}>{toTitleCase(children)}</Text>
}

function VerificationStepSection({
  title,
  state,
  children,
}: {
  title: string
  state: AdminStepState
  children: ReactNode
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const needsAttention = state !== 'complete'

  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, needsAttention && styles.sectionTitleAttention]}>
          {toTitleCase(title)}
        </Text>
        <ReviewStatusBadge label={stepStateLabel(state)} state={state} />
      </View>
      <View style={[styles.card, needsAttention ? styles.cardAttention : state === 'complete' ? styles.cardComplete : null]}>
        {children}
      </View>
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
      const lower = waitingLabel.toLowerCase()
      const style = lower.includes('approved')
        ? styles.completeText
        : lower.includes('rejected') || lower.includes('uploaded')
          ? styles.pendingText
          : styles.attentionText
      return <Text style={style}>{toTitleCase(waitingLabel)}</Text>
    }
    return null
  }

  return (
    <>
      {!phoneVerified ? (
        <Text style={styles.attentionText}>
          {toTitleCase('Phone must be verified with a support code before you can approve documents.')}
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
    adminApproveUser,
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
  const needsFinalize = usersStuckPendingVerification([user]).length > 0
  const phoneState = phoneStepState(phoneVerified, codeRequest)
  const idState = documentStepState(hasIdDocument(verification), idReviewStatus)
  const selfieState = documentStepState(hasSelfie(verification), selfieReviewStatus)
  const addressState = documentStepState(hasAddressProof(verification), addressReviewStatus)
  const isHost = user.role === 'host'
  const openSteps: AdminStepState[] = [
    phoneState,
    idState,
    selfieState,
    ...(isHost ? [addressState] : []),
  ]
  const incompleteCount = openSteps.filter((state) => state !== 'complete').length

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

  const notifyIfRejected = async (updatedUser: User | null, kind: VerificationDocumentKind) => {
    if (!updatedUser) return
    const notifyRole = updatedUser.role === 'host' ? 'host' : 'customer'
    await push(
      userId,
      VERIFICATION_REJECTED_TITLE,
      buildVerificationRejectedBody(kind, notifyRole),
      identityVerificationLink(),
    )
  }

  const notifyIfDocApproved = async (updatedUser: User | null, kind: VerificationDocumentKind) => {
    if (!updatedUser || isIdentityVerified(updatedUser)) return
    await push(
      userId,
      VERIFICATION_DOC_APPROVED_TITLE,
      buildVerificationDocApprovedBody(kind),
      identityVerificationLink(),
    )
  }

  const runReviewAction = async (
    action: () => Promise<{ user: User | null; error?: string }>,
    successMessage: string,
    options?: { rejectDoc?: VerificationDocumentKind; approveDoc?: VerificationDocumentKind },
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
      if (options?.rejectDoc) {
        await notifyIfRejected(result.user, options.rejectDoc)
      } else if (options?.approveDoc) {
        await notifyIfDocApproved(result.user, options.approveDoc)
      }
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
    const result = await deliverVerificationCodeToUser({
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
    void runReviewAction(() => adminApproveUserId(userId), 'Government ID approved.', {
      approveDoc: 'id',
    })

  const handleRejectId = () =>
    void runReviewAction(() => adminRejectUserId(userId), 'Government ID rejected.', {
      rejectDoc: 'id',
    })

  const handleApproveAddress = () =>
    void runReviewAction(() => adminApproveUserAddress(userId), 'Address proof approved.', {
      approveDoc: 'address',
    })

  const handleRejectAddress = () =>
    void runReviewAction(() => adminRejectUserAddress(userId), 'Address proof rejected.', {
      rejectDoc: 'address',
    })

  const handleApproveSelfie = () =>
    void runReviewAction(() => adminApproveUserSelfie(userId), 'Verification selfie approved.', {
      approveDoc: 'selfie',
    })

  const handleRejectSelfie = () =>
    void runReviewAction(() => adminRejectUserSelfie(userId), 'Verification selfie rejected.', {
      rejectDoc: 'selfie',
    })

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

        {incompleteCount > 0 && verification.status !== 'verified' ? (
          <View style={[styles.banner, styles.bannerAttention]}>
            <AppIcon name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.bannerAttentionText}>
              {toTitleCase(
                `${incompleteCount} step${incompleteCount === 1 ? '' : 's'} still need attention — highlighted in red below.`,
              )}
            </Text>
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

        <VerificationStepSection title="Phone verification" state={phoneState}>
            <DetailRow
              label="Phone verified"
              value={phoneVerified ? 'Yes — code entered in app' : 'Waiting for verification code'}
            />
            {codeRequest ? (
              <>
                <DetailRow
                  label="Code request"
                  value={codeRequest.status === 'pending' ? 'Waiting to send' : 'Code sent to phone'}
                />
                <DetailRow label="Phone number" value={formatPhoneDisplay(codeRequest.phone)} />
                {assignedCode ? <DetailRow label="Assigned code" value={assignedCode} mono /> : null}
                {canSendCode ? (
                  <PrimaryButton
                    title={busy ? 'Opening messages…' : 'Send verification code'}
                    icon="message-circle"
                    full
                    disabled={busy}
                    onPress={() => void handleSendCode()}
                  />
                ) : codeRequest.status === 'code_sent' ? (
                  <StepStatusMessage state="action_needed">
                    Code sent — waiting for the user to enter it in the app.
                  </StepStatusMessage>
                ) : null}
              </>
            ) : (
              <StepStatusMessage state="missing">No open phone code request.</StepStatusMessage>
            )}
        </VerificationStepSection>

        <VerificationStepSection title="ID verification" state={idState}>
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
            ) : idReviewStatus === 'approved' ? (
              <StepStatusMessage state="complete">
                Government ID approved — photo not available in this admin view.
              </StepStatusMessage>
            ) : (
              <StepStatusMessage state={idState}>No ID document uploaded yet.</StepStatusMessage>
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
                idReviewStatus === 'approved'
                  ? 'Government ID approved.'
                  : idReviewStatus === 'rejected'
                    ? 'Government ID rejected — user must resubmit.'
                    : hasIdDocument(verification)
                      ? 'Government ID uploaded — approve or reject.'
                      : undefined
              }
            />
        </VerificationStepSection>

        <VerificationStepSection title="Selfie verification" state={selfieState}>
            <Text style={styles.reviewHint}>
              {toTitleCase('Compare this live selfie with the photo on the government ID above.')}
            </Text>
            {verification.selfiePhotoUri ? (
              <VerificationDocumentPreview
                uri={verification.selfiePhotoUri}
                label="Verification selfie"
                onViewImage={setLightboxUri}
              />
            ) : selfieReviewStatus === 'approved' ? (
              <StepStatusMessage state="complete">
                Verification selfie approved — photo not available in this admin view.
              </StepStatusMessage>
            ) : (
              <StepStatusMessage state={selfieState}>No verification selfie uploaded yet.</StepStatusMessage>
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
                selfieReviewStatus === 'approved'
                  ? 'Verification selfie approved.'
                  : selfieReviewStatus === 'rejected'
                    ? 'Verification selfie rejected — user must resubmit.'
                    : hasSelfie(verification)
                      ? 'Selfie uploaded — approve or reject.'
                      : undefined
              }
            />
        </VerificationStepSection>

        {isHost ? (
          <VerificationStepSection title="Address verification" state={addressState}>
              {verification.address ? <DetailRow label="Listed address" value={verification.address} /> : null}
              {verification.addressProofUri ? (
                <VerificationDocumentPreview
                  uri={verification.addressProofUri}
                  mimeType={verification.addressProofMimeType}
                  name={verification.addressProofName}
                  label="Utility bill or lease"
                  onViewImage={setLightboxUri}
                />
              ) : addressReviewStatus === 'approved' ? (
                <StepStatusMessage state="complete">
                  Address proof approved — file not available in this admin view.
                </StepStatusMessage>
              ) : (
                <StepStatusMessage state={addressState}>No address proof uploaded yet.</StepStatusMessage>
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
                  addressReviewStatus === 'approved'
                    ? 'Address proof approved.'
                    : addressReviewStatus === 'rejected'
                      ? 'Address proof rejected — user must resubmit.'
                      : hasAddressProof(verification)
                        ? 'Address proof uploaded — approve or reject.'
                        : undefined
                }
              />
          </VerificationStepSection>
        ) : null}

        {needsFinalize ? (
          <View style={styles.section}>
            <View style={[styles.card, styles.cardAttention]}>
              <Text style={styles.pendingText}>
                {toTitleCase(
                  'All documents are approved but verification is still marked pending. Tap below to finalize.',
                )}
              </Text>
              <SuccessButton
                title={busy ? 'Finalizing…' : 'Mark as verified'}
                icon="check-circle"
                full
                disabled={busy}
                onPress={() =>
                  void runReviewAction(
                    () => adminApproveUser(userId),
                    'User verification finalized.',
                  )
                }
              />
            </View>
          </View>
        ) : null}

        {verification.status === 'pending' &&
        !needsFinalize &&
        (idReviewStatus === 'approved' ||
          selfieReviewStatus === 'approved' ||
          addressReviewStatus === 'approved') ? (
          <View style={styles.section}>
            <View style={[styles.card, styles.cardAttention]}>
              <Text style={styles.pendingText}>
                {toTitleCase(
                  isHost
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
            <View style={[styles.card, styles.cardAttention]}>
              <Text style={styles.attentionText}>
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
    sectionTitleAttention: { color: colors.danger },
    reviewStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.gray100,
    },
    reviewStatusBadgeText: { fontSize: 10, fontWeight: '700', color: colors.gray600 },
    badgeComplete: { backgroundColor: colors.greenBg, borderWidth: 1, borderColor: colors.green },
    badgeCompleteText: { color: colors.green },
    badgeAttention: { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.danger },
    badgeAttentionText: { color: colors.danger },
    badgePending: { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.danger },
    badgePendingText: { color: colors.danger },
    card: {
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: colors.white,
      gap: spacing.sm,
    },
    cardAttention: {
      borderColor: colors.danger,
      backgroundColor: colors.gray50,
    },
    cardComplete: {
      borderColor: colors.green,
      backgroundColor: colors.greenBg,
    },
    approvedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.greenBg,
      borderColor: colors.green,
    },
    approvedText: { fontSize: 14, fontWeight: '600', color: colors.gray600, flex: 1 },
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
    bannerSuccessText: { flex: 1, fontSize: 13, color: colors.gray600, lineHeight: 18, fontWeight: '600' },
    bannerAttention: { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.danger },
    bannerAttentionText: { flex: 1, fontSize: 13, color: colors.danger, lineHeight: 18, fontWeight: '600' },
    detailRow: { gap: 2 },
    detailLabel: { fontSize: 11, fontWeight: '700', color: colors.gray500, letterSpacing: 0.3 },
    detailValue: { fontSize: 14, color: colors.black, lineHeight: 20 },
    detailMono: { fontFamily: 'Menlo', letterSpacing: 1 },
    emptyText: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
    attentionText: { fontSize: 13, color: colors.danger, lineHeight: 18, fontWeight: '600' },
    pendingText: { fontSize: 13, color: colors.danger, lineHeight: 18, fontWeight: '600' },
    completeText: { fontSize: 13, color: colors.green, lineHeight: 18, fontWeight: '600' },
    reviewHint: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  })
}
