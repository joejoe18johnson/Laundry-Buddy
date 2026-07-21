import { useEffect, useMemo, useState } from 'react'
import { AppState, StyleSheet, Text, View } from 'react-native'
import { AddressProofCapture, type AddressProofFile } from '../../components/AddressProofCapture'
import { IdDocumentCapture } from '../../components/IdDocumentCapture'
import { SelfieCapture } from '../../components/SelfieCapture'
import { BrandAlert } from '../../components/BrandDialog'
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
  isPhoneVerificationComplete,
  type VerificationWizardStep,
} from '../../lib/identityVerification'
import { adminDashboardLink } from '../../lib/notificationLinks'
import { normalizePhone } from '../../lib/phone'
import { getOpenVerificationCodeRequest } from '../../lib/verificationCodeService'
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
import type { VerificationCodeRequest } from '../../lib/verificationRequestStorage'

type WizardStep = VerificationWizardStep

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
  const [selfiePhotoUri, setSelfiePhotoUri] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [addressProof, setAddressProof] = useState<AddressProofFile | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [requestingCode, setRequestingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeRequest, setCodeRequest] = useState<VerificationCodeRequest | null>(null)
  const [codeAcceptedAlertOpen, setCodeAcceptedAlertOpen] = useState(false)

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
    if (verification.selfiePhotoUri && !selfiePhotoUri) {
      setSelfiePhotoUri(verification.selfiePhotoUri)
    }
  }, [user, address, addressProof, selfiePhotoUri])

  useEffect(() => {
    if (!user) return
    void getOpenVerificationCodeRequest(user.id).then(setCodeRequest)
  }, [user])

  useEffect(() => {
    if (!user) return
    if (isPhoneVerificationComplete(user) && step === 'phone') {
      setStep('id')
    }
  }, [step, user])

  useEffect(() => {
    if (!user) return
    void refreshCurrentUser()
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void getOpenVerificationCodeRequest(user.id).then(setCodeRequest)
        void refreshCurrentUser()
      }
    })
    return () => subscription.remove()
  }, [user, refreshCurrentUser])

  if (!user || !verification) return null

  const phoneReady = isValidWhatsAppNumber(phone)
  const idReady = !!idType && !!idPhotoUri
  const selfieReady = !!selfiePhotoUri
  const addressReady = !isHost || (address.trim().length > 0 && !!addressProof)
  const codeReady = /^\d{6}$/.test(codeInput.trim())
  const hasOpenCodeRequest = !!codeRequest
  const canEnterCode = codeRequest?.status === 'code_sent'

  const refreshCodeRequest = async () => {
    const next = await getOpenVerificationCodeRequest(user.id)
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
      await refreshCurrentUser()
      await refreshCodeRequest()
      setStep('id')
      setCodeAcceptedAlertOpen(true)
    }
    setVerifyingCode(false)
  }


  const handleContinueFromId = () => {
    if (!idReady) return
    setStep('selfie')
  }

  const handleContinueFromSelfie = () => {
    if (!selfieReady) return
    if (isHost) {
      setStep('address')
      return
    }
    void handleSubmit()
  }

  const handleSubmit = async () => {
    if (!phoneReady || !idReady || !idType || !idPhotoUri || !selfiePhotoUri) return
    if (isHost && !addressReady) return

    setSubmitting(true)
    clearAuthError()
    try {
      const ok = await submitIdentityVerification({
        phone: normalizePhone(phone),
        idType,
        idPhotoUri,
        selfiePhotoUri,
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
    !isPhoneVerificationComplete(user) &&
    (verification.status === 'none' || verification.status === 'rejected')

  const showDocumentWizard =
    isPhoneVerificationComplete(user) &&
    (verification.status === 'none' || verification.status === 'rejected')

  const verificationCodePanel = showVerificationCodePanel ? (
    <View style={styles.stepBlock}>
      <View style={styles.sectionHeader}>
        <AppIcon name="key" size={18} />
        <Text style={styles.sectionTitle}>{toTitleCase('Verification code')}</Text>
      </View>
      <Text style={styles.sectionSub}>
        {toTitleCase(
          'Step 1: request a code. Support sends it on WhatsApp. Step 2: enter the 6-digit code here.',
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

  const wizardContent = showDocumentWizard ? (
      <>
        {step === 'id' && (
          <View style={styles.stepBlock}>
            <View style={styles.sectionHeader}>
              <AppIcon name="credit-card" size={18} />
              <Text style={styles.sectionTitle}>{toTitleCase('Step 2 · Government ID')}</Text>
            </View>
            <Text style={styles.sectionSub}>
              {toTitleCase('Select your document type first, then upload a clear photo of your government ID.')}
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
                title="Continue to selfie"
                icon="arrow-right"
                full
                disabled={!idReady || submitting}
                onPress={handleContinueFromId}
              />
              <GhostButton title="Back to phone verification" icon="arrow-left" full onPress={() => setStep('phone')} />
            </View>
          </View>
        )}

        {step === 'selfie' && (
          <View style={styles.stepBlock}>
            <View style={styles.sectionHeader}>
              <AppIcon name="user" size={18} />
              <Text style={styles.sectionTitle}>{toTitleCase('Step 3 · Selfie')}</Text>
            </View>
            <SelfieCapture
              photoUri={selfiePhotoUri}
              onPhotoChange={(uri) => {
                setSelfiePhotoUri(uri)
                clearAuthError()
              }}
            />
            {authError ? <Text style={styles.error}>{authError}</Text> : null}
            <View style={styles.actionStack}>
              <PrimaryButton
                title={isHost ? 'Continue to address' : 'Submit verification'}
                icon={isHost ? 'arrow-right' : 'check-circle'}
                full
                disabled={!selfieReady || submitting}
                onPress={handleContinueFromSelfie}
              />
              <GhostButton title="Back to ID upload" icon="arrow-left" full onPress={() => setStep('id')} />
            </View>
          </View>
        )}

        {step === 'address' && isHost && (
          <View style={styles.stepBlock}>
            <View style={styles.sectionHeader}>
              <AppIcon name="home" size={18} />
              <Text style={styles.sectionTitle}>{toTitleCase('Step 4 · Host address')}</Text>
            </View>
            <Text style={styles.sectionSub}>
              {toTitleCase(
                'Hosts must verify where guests drop off laundry. Enter your address and upload proof that you live there.',
              )}
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
              <GhostButton title="Back to selfie" icon="arrow-left" full onPress={() => setStep('selfie')} />
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
        wizardStep={
          showDocumentWizard
            ? step === 'address'
              ? 'address'
              : step === 'selfie'
                ? 'selfie'
                : 'id'
            : showVerificationCodePanel
              ? 'phone'
              : undefined
        }
        footer={actionFooter}
      >
        {verificationCodePanel}
        {wizardContent}
      </VerificationCenter>

      <BrandAlert
        visible={codeAcceptedAlertOpen}
        title="Code accepted"
        message={
          'Your phone number is verified. Continue below to upload your ID' +
          (isHost ? ', take a matching selfie, and add address proof.' : ' and take a matching selfie.')
        }
        icon="check-circle"
        confirmLabel="Continue"
        onClose={() => setCodeAcceptedAlertOpen(false)}
      />
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
