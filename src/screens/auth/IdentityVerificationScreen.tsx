import { useEffect, useMemo, useState } from 'react'
import { Alert, AppState, StyleSheet, Text, View } from 'react-native'
import { AddressProofCapture, type AddressProofFile } from '../../components/AddressProofCapture'
import { IdDocumentCapture } from '../../components/IdDocumentCapture'
import { AppIcon } from '../../components/AppIcon'
import { VerificationCenter } from '../../components/VerificationCenter'
import {
  AppTextInput,
  BackButton,
  ChoiceChip,
  GhostButton,
  OutlineButton,
  PrimaryButton,
  Screen,
} from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { useTheme } from '../../context/ThemeContext'
import { getAdminUsers } from '../../lib/adminUsers'
import {
  formatIdDocumentType,
  getIdentityVerification,
  ID_DOCUMENT_OPTIONS,
  isIdentityVerified,
} from '../../lib/identityVerification'
import { adminDashboardLink } from '../../lib/notificationLinks'
import { normalizePhone } from '../../lib/phone'
import {
  getVerificationCodeRequestForUser,
  type VerificationCodeRequest,
} from '../../lib/verificationRequestStorage'
import {
  buildAdminVerificationRequestBody,
  VERIFICATION_CODE_REQUEST_TITLE,
} from '../../lib/verificationCodes'
import {
  formatWhatsAppNumberDisplay,
  isValidWhatsAppNumber,
} from '../../lib/whatsappVerification'
import { radius, spacing } from '../../theme'
import { toTitleCase } from '../../lib/titleCase'
import type { IdDocumentType } from '../../types'

type WizardStep = 'phone' | 'id' | 'address'

export function IdentityVerificationScreen({ onBrowse }: { onBrowse?: () => void }) {
  const {
    user,
    submitIdentityVerification,
    requestVerificationCode,
    submitVerificationCode,
    refreshCurrentUser,
    logout,
    authError,
    clearAuthError,
  } = useAuth()
  const { push } = useNotifications()
  const [step, setStep] = useState<WizardStep>('phone')
  const [phone, setPhone] = useState('')
  const [idType, setIdType] = useState<IdDocumentType | null>(null)
  const [idPhotoUri, setIdPhotoUri] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [addressProof, setAddressProof] = useState<AddressProofFile | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [requestingCode, setRequestingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeRequest, setCodeRequest] = useState<VerificationCodeRequest | null>(null)

  const verification = user ? getIdentityVerification(user) : null
  const isHost = user?.role === 'host'
  const { colors } = useTheme()
  const styles = useMemo(() => createIdentityVerificationStyles(colors), [colors])

  useEffect(() => {
    if (!user?.phone) return
    setPhone((current) => current || user.phone!.replace(/^501/, ''))
  }, [user?.phone])

  useEffect(() => {
    if (!user) return
    const verification = getIdentityVerification(user)
    if (verification.address && !address) {
      setAddress(verification.address)
    }
    if (verification.addressProofUri && !addressProof) {
      setAddressProof({
        uri: verification.addressProofUri,
        mimeType: verification.addressProofMimeType ?? 'image/jpeg',
        name: verification.addressProofName ?? 'Utility bill',
      })
    }
  }, [user, address, addressProof])

  useEffect(() => {
    if (!user) return
    void getVerificationCodeRequestForUser(user.id).then(setCodeRequest)
  }, [user])

  useEffect(() => {
    if (!user) return
    void refreshCurrentUser()
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void getVerificationCodeRequestForUser(user.id).then(setCodeRequest)
        void refreshCurrentUser()
      }
    })
    return () => subscription.remove()
  }, [user, refreshCurrentUser])

  if (!user || !verification) return null

  const phoneReady = isValidWhatsAppNumber(phone)
  const idReady = !!idType && !!idPhotoUri
  const addressReady = !isHost || (address.trim().length > 0 && !!addressProof)
  const codeReady = /^\d{6}$/.test(codeInput.trim())
  const hasOpenCodeRequest = !!codeRequest
  const canEnterCode = codeRequest?.status === 'code_sent'

  const refreshCodeRequest = async () => {
    const next = await getVerificationCodeRequestForUser(user.id)
    setCodeRequest(next)
  }

  const handleRequestCode = async () => {
    clearAuthError()
    if (!phoneReady) return
    setRequestingCode(true)
    const ok = await requestVerificationCode(normalizePhone(phone))
    if (ok) {
      await refreshCodeRequest()
      const admins = await getAdminUsers()
      const normalizedPhone = normalizePhone(phone)
      await Promise.all(
        admins.map((admin) =>
          push(
            admin.id,
            VERIFICATION_CODE_REQUEST_TITLE,
            buildAdminVerificationRequestBody(user.name, normalizedPhone),
            adminDashboardLink(user.id),
          ),
        ),
      )
    }
    setRequestingCode(false)
  }

  const handleSubmitCode = async () => {
    clearAuthError()
    if (!codeReady) return
    setVerifyingCode(true)
    const ok = await submitVerificationCode(codeInput.trim())
    if (ok) {
      setCodeInput('')
      setCodeRequest(null)
      Alert.alert(
        toTitleCase('Code accepted'),
        toTitleCase(
          'Your phone number is verified. Continue below to upload your ID' +
            (isHost ? ' and address proof.' : '.'),
        ),
        [{ text: toTitleCase('Continue') }],
      )
    }
    setVerifyingCode(false)
  }

  const handleContinueFromPhone = () => {
    if (!phoneReady) return
    setStep('id')
  }

  const handleContinueFromId = () => {
    if (!idReady) return
    if (isHost) {
      setStep('address')
      return
    }
    void handleSubmit()
  }

  const handleSubmit = async () => {
    if (!phoneReady || !idReady || !idType || !idPhotoUri) return
    if (isHost && !addressReady) return

    setSubmitting(true)
    clearAuthError()
    try {
      const ok = await submitIdentityVerification({
        phone: normalizePhone(phone),
        idType,
        idPhotoUri,
        address: isHost ? address.trim() : undefined,
        addressProofUri: isHost ? addressProof?.uri : undefined,
        addressProofMimeType: isHost ? addressProof?.mimeType : undefined,
        addressProofName: isHost ? addressProof?.name : undefined,
      })
      if (!ok) setSubmitting(false)
    } catch {
      setSubmitting(false)
    }
  }

  const showVerificationCodePanel =
    verification.status === 'none' || verification.status === 'rejected'

  const verificationCodePanel = showVerificationCodePanel ? (
    <View style={styles.stepBlock}>
      <View style={styles.sectionHeader}>
        <AppIcon name="key" size={18} />
        <Text style={styles.sectionTitle}>{toTitleCase('Verification code')}</Text>
      </View>
      <Text style={styles.sectionSub}>
        {toTitleCase(
          'Request a code — support will send it on WhatsApp. Enter the 6-digit code here once you receive it.',
        )}
      </Text>
      <View style={styles.phoneRow}>
        <Text style={styles.prefix}>+501</Text>
        <AppTextInput
          style={styles.phoneInput}
          placeholder="600 1234"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>
      {phoneReady ? (
        <Text style={styles.phonePreview}>
          {formatWhatsAppNumberDisplay(normalizePhone(phone))}
        </Text>
      ) : null}
      {hasOpenCodeRequest ? (
        <View style={styles.requestStatus}>
          <AppIcon
            name={codeRequest?.status === 'code_sent' ? 'check-circle' : 'clock'}
            size={18}
            color={codeRequest?.status === 'code_sent' ? colors.green : colors.gray600}
          />
          <Text style={styles.requestStatusText}>
            {codeRequest?.status === 'code_sent'
              ? toTitleCase('Code sent on WhatsApp — enter it below.')
              : toTitleCase('Request sent — support will WhatsApp your code soon.')}
          </Text>
        </View>
      ) : null}
      <View style={styles.actionStack}>
        <PrimaryButton
          title={hasOpenCodeRequest ? 'Request sent' : 'Request verification code'}
          icon="send"
          full
          disabled={!phoneReady || requestingCode || hasOpenCodeRequest}
          onPress={() => void handleRequestCode()}
        />
      </View>
      {canEnterCode ? (
        <>
          <AppTextInput
            style={styles.codeInput}
            placeholder="6-digit code"
            keyboardType="number-pad"
            maxLength={6}
            value={codeInput}
            onChangeText={(value) => {
              setCodeInput(value)
              if (authError) clearAuthError()
            }}
          />
          {authError ? <Text style={styles.error}>{authError}</Text> : null}
          <PrimaryButton
            title="Verify code"
            icon="check-circle"
            full
            disabled={!codeReady || verifyingCode}
            onPress={() => void handleSubmitCode()}
          />
        </>
      ) : null}
      {!canEnterCode && authError && hasOpenCodeRequest ? (
        <Text style={styles.error}>{authError}</Text>
      ) : null}
    </View>
  ) : null

  const actionFooter = (
    <View style={styles.actionStack}>
      {isIdentityVerified(user) ? (
        <View style={styles.verifiedNote}>
          <AppIcon name="check-circle" size={18} color={colors.green} />
          <Text style={styles.verifiedNoteText}>
            {toTitleCase(
              user.role === 'host'
                ? 'You are verified — hosting is unlocked. You will not need to complete verification again.'
                : 'You are verified — booking is unlocked. You will not need to complete verification again.',
            )}
          </Text>
        </View>
      ) : null}
      {onBrowse ? (
        isIdentityVerified(user) ? (
          <PrimaryButton title="Continue to app" icon="check-circle" full onPress={onBrowse} />
        ) : (
          <OutlineButton title="Browse app" icon="home" full onPress={onBrowse} />
        )
      ) : null}
      <GhostButton title="Log out" icon="log-out" full onPress={logout} />
    </View>
  )

  const wizardContent =
    verification.status === 'none' || verification.status === 'rejected' ? (
      <>
        {step === 'phone' && (
          <View style={styles.stepBlock}>
            <View style={styles.sectionHeader}>
              <AppIcon name="phone" size={18} />
              <Text style={styles.sectionTitle}>{toTitleCase('Step 1 · Phone number')}</Text>
            </View>
            <Text style={styles.sectionSub}>
              {toTitleCase(
                'Enter your phone number. Support will send your verification code via WhatsApp.',
              )}
            </Text>
            <View style={styles.phoneRow}>
              <Text style={styles.prefix}>+501</Text>
              <AppTextInput
                style={styles.phoneInput}
                placeholder="600 1234"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            {phoneReady ? (
              <Text style={styles.phonePreview}>
                {formatWhatsAppNumberDisplay(normalizePhone(phone))}
              </Text>
            ) : null}
            <View style={styles.actionStack}>
              <PrimaryButton
                title="Continue to ID upload"
                icon="arrow-right"
                full
                disabled={!phoneReady}
                onPress={handleContinueFromPhone}
              />
            </View>
          </View>
        )}

        {step === 'id' && (
          <View style={styles.stepBlock}>
            <View style={styles.sectionHeader}>
              <AppIcon name="credit-card" size={18} />
              <Text style={styles.sectionTitle}>{toTitleCase('Step 2 · Government ID')}</Text>
            </View>
            <Text style={styles.sectionSub}>
              {toTitleCase('Select your document type first, then upload a clear photo.')}
            </Text>
            <View style={styles.idTypeRow}>
              {ID_DOCUMENT_OPTIONS.map((option) => (
                <ChoiceChip
                  key={option.value}
                  label={option.label}
                  selected={idType === option.value}
                  onPress={() => {
                    setIdType(option.value)
                    setIdPhotoUri(null)
                    clearAuthError()
                  }}
                />
              ))}
            </View>
            <IdDocumentCapture
              photoUri={idPhotoUri}
              onPhotoChange={setIdPhotoUri}
              disabled={!idType}
              label={
                idType
                  ? toTitleCase(`Upload ${formatIdDocumentType(idType)} photo`)
                  : toTitleCase('Select document type first')
              }
            />
            {authError ? <Text style={styles.error}>{authError}</Text> : null}
            <View style={styles.actionStack}>
              <PrimaryButton
                title={isHost ? 'Continue to address' : 'Submit verification'}
                icon={isHost ? 'arrow-right' : 'check-circle'}
                full
                disabled={!idReady || submitting}
                onPress={handleContinueFromId}
              />
              <GhostButton title="Back to phone number" icon="arrow-left" full onPress={() => setStep('phone')} />
            </View>
          </View>
        )}

        {step === 'address' && isHost && (
          <View style={styles.stepBlock}>
            <View style={styles.sectionHeader}>
              <AppIcon name="home" size={18} />
              <Text style={styles.sectionTitle}>{toTitleCase('Step 3 · Host address')}</Text>
            </View>
            <Text style={styles.sectionSub}>
              {toTitleCase('Where guests drop off laundry, plus proof that you live there.')}
            </Text>
            <AppTextInput
              style={styles.addressInput}
              placeholder="22 Coconut St., Las Flores"
              value={address}
              onChangeText={setAddress}
            />
            <Text style={styles.sectionSub}>
              {toTitleCase('Upload a utility bill, lease, or other proof that shows this address in your name.')}
            </Text>
            <AddressProofCapture
              file={addressProof}
              onFileChange={(file) => {
                setAddressProof(file)
                clearAuthError()
              }}
              label={toTitleCase('Upload utility bill or lease')}
            />
            <View style={styles.actionStack}>
              <PrimaryButton
                title="Submit verification"
                icon="check-circle"
                full
                disabled={!addressReady || submitting}
                onPress={() => void handleSubmit()}
              />
              {authError ? <Text style={styles.error}>{authError}</Text> : null}
              <GhostButton title="Back to ID upload" icon="arrow-left" full onPress={() => setStep('id')} />
            </View>
          </View>
        )}
      </>
    ) : null

  return (
    <Screen style={styles.screen}>
      {onBrowse ? <BackButton onPress={onBrowse} label="Browse app" /> : null}

      <VerificationCenter
        user={user}
        status={verification.status}
        wizardStep={verification.status === 'none' || verification.status === 'rejected' ? step : undefined}
        footer={actionFooter}
      >
        {verificationCodePanel}
        {wizardContent}
      </VerificationCenter>
    </Screen>
  )
}

function createIdentityVerificationStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: { paddingBottom: spacing.xl },
    stepBlock: {
      gap: spacing.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.gray200,
      borderRadius: radius.lg,
      backgroundColor: colors.white,
      marginBottom: spacing.md,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.black },
    sectionSub: { fontSize: 13, color: colors.gray600, lineHeight: 20 },
    phoneRow: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.gray200,
      borderRadius: radius.sm,
      overflow: 'hidden',
      backgroundColor: colors.white,
    },
    prefix: {
      padding: 16,
      backgroundColor: colors.gray50,
      borderRightWidth: 1,
      borderRightColor: colors.gray200,
      fontSize: 16,
      color: colors.gray600,
    },
    phoneInput: { flex: 1, borderWidth: 0, padding: 16, backgroundColor: colors.white },
    phonePreview: { fontSize: 14, fontWeight: '600', color: colors.black },
    codeInput: {
      borderWidth: 1,
      borderColor: colors.gray200,
      borderRadius: radius.sm,
      padding: 16,
      fontSize: 24,
      fontWeight: '700',
      letterSpacing: 6,
      textAlign: 'center',
      backgroundColor: colors.white,
    },
    requestStatus: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.gray50,
    },
    requestStatusText: { flex: 1, fontSize: 13, color: colors.gray600, lineHeight: 18 },
    idTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    addressInput: { marginBottom: spacing.sm },
    actionStack: { gap: spacing.sm, width: '100%' },
    verifiedNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.greenBg,
    },
    verifiedNoteText: { flex: 1, fontSize: 14, color: colors.green, lineHeight: 20, fontWeight: '600' },
    error: {
      color: colors.danger,
      backgroundColor: colors.gray50,
      padding: spacing.md,
      borderRadius: radius.sm,
      fontSize: 14,
      lineHeight: 20,
      marginTop: spacing.sm,
    },
  })
}
