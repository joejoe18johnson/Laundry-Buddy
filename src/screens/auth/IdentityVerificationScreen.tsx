import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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
import { useTheme } from '../../context/ThemeContext'
import { useMessages } from '../../context/MessageContext'
import {
  formatIdDocumentType,
  getIdentityVerification,
  ID_DOCUMENT_OPTIONS,
  isIdentityVerified,
} from '../../lib/identityVerification'
import { normalizePhone } from '../../lib/phone'
import {
  buildVerificationCodeRequestMessage,
  supportThreadId,
} from '../../lib/chatThreads'
import {
  formatWhatsAppNumberDisplay,
  isValidWhatsAppNumber,
} from '../../lib/whatsappVerification'
import { ChatThreadPanel } from '../shared/ChatScreen'
import { radius, spacing } from '../../theme'
import { toTitleCase } from '../../lib/titleCase'
import type { IdDocumentType } from '../../types'

type WizardStep = 'phone' | 'id' | 'address'

export function IdentityVerificationScreen({ onBrowse }: { onBrowse?: () => void }) {
  const { user, submitIdentityVerification, logout, authError, clearAuthError } = useAuth()
  const [step, setStep] = useState<WizardStep>('phone')
  const [phone, setPhone] = useState('')
  const [idType, setIdType] = useState<IdDocumentType | null>(null)
  const [idPhotoUri, setIdPhotoUri] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [addressUploaded, setAddressUploaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [supportChatOpen, setSupportChatOpen] = useState(false)
  const { sendMessage } = useMessages()

  const verification = user ? getIdentityVerification(user) : null
  const isHost = user?.role === 'host'
  const { colors } = useTheme()
  const styles = useMemo(() => createIdentityVerificationStyles(colors), [colors])

  useEffect(() => {
    if (!user?.phone) return
    setPhone((current) => current || user.phone!.replace(/^501/, ''))
  }, [user?.phone])

  if (!user || !verification) return null

  const phoneReady = isValidWhatsAppNumber(phone)
  const idReady = !!idType && !!idPhotoUri
  const addressReady = !isHost || (address.trim().length > 0 && addressUploaded)

  const handleRequestCodeInApp = async () => {
    clearAuthError()
    if (!phoneReady || !user) return
    await sendMessage({
      threadId: supportThreadId(user.id),
      text: buildVerificationCodeRequestMessage(user.name, normalizePhone(phone)),
    })
    setSupportChatOpen(true)
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
        addressUploaded: isHost ? addressUploaded : undefined,
      })
      if (!ok) setSubmitting(false)
    } catch {
      setSubmitting(false)
    }
  }

  const actionFooter = (
    <View style={styles.actionStack}>
      {verification.status === 'pending' ? (
        <PrimaryButton
          title="Open support chat"
          icon="message-circle"
          full
          onPress={() => setSupportChatOpen(true)}
        />
      ) : null}
      {isIdentityVerified(user) ? (
        <View style={styles.verifiedNote}>
          <AppIcon name="check-circle" size={18} color={colors.green} />
          <Text style={styles.verifiedNoteText}>
            {toTitleCase('You are verified — booking and hosting are unlocked.')}
          </Text>
        </View>
      ) : null}
      {onBrowse ? (
        <OutlineButton title="Browse app" icon="home" full onPress={onBrowse} />
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
              <AppIcon name="message-circle" size={18} />
              <Text style={styles.sectionTitle}>{toTitleCase('Step 1 · WhatsApp number')}</Text>
            </View>
            <Text style={styles.sectionSub}>
              {toTitleCase(
                'Use the WhatsApp number where we can reach you. Request your code in support chat, then reply with it.',
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
                {toTitleCase('WhatsApp')}: {formatWhatsAppNumberDisplay(normalizePhone(phone))}
              </Text>
            ) : null}
            <View style={styles.actionStack}>
              <OutlineButton
                title="Request code in support chat"
                icon="message-circle"
                full
                disabled={!phoneReady}
                onPress={() => void handleRequestCodeInApp()}
              />
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
              {toTitleCase("Choose passport, driver's license, or social security card — then upload a clear photo.")}
            </Text>
            <View style={styles.idTypeRow}>
              {ID_DOCUMENT_OPTIONS.map((option) => (
                <ChoiceChip
                  key={option.value}
                  label={option.label}
                  selected={idType === option.value}
                  onPress={() => setIdType(option.value)}
                />
              ))}
            </View>
            <IdDocumentCapture
              photoUri={idPhotoUri}
              onPhotoChange={setIdPhotoUri}
              label={
                idType
                  ? toTitleCase(`Upload ${formatIdDocumentType(idType)} photo`)
                  : toTitleCase('Select document type first')
              }
            />
            <View style={styles.actionStack}>
              <PrimaryButton
                title={isHost ? 'Continue to address' : 'Submit verification'}
                icon={isHost ? 'arrow-right' : 'check-circle'}
                full
                disabled={!idReady || submitting}
                onPress={handleContinueFromId}
              />
              <GhostButton title="Back to WhatsApp" icon="arrow-left" full onPress={() => setStep('phone')} />
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
            <Text style={styles.sectionSub}>{toTitleCase('Utility bill or lease in your name')}</Text>
            <Pressable
              onPress={() => setAddressUploaded(true)}
              style={[styles.upload, addressUploaded && styles.uploadDone]}
            >
              <AppIcon
                name={addressUploaded ? 'check-circle' : 'upload'}
                size={24}
                color={addressUploaded ? colors.green : colors.gray500}
              />
              <Text style={[styles.uploadText, addressUploaded && styles.uploadTextDone]}>
                {addressUploaded ? toTitleCase('Address proof uploaded') : toTitleCase('Upload address proof')}
              </Text>
            </Pressable>
            <View style={styles.actionStack}>
              <PrimaryButton
                title="Submit verification"
                icon="check-circle"
                full
                disabled={!addressReady || submitting}
                onPress={() => void handleSubmit()}
              />
              <GhostButton title="Back to ID upload" icon="arrow-left" full onPress={() => setStep('id')} />
            </View>
          </View>
        )}

        {authError ? <Text style={styles.error}>{authError}</Text> : null}
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
        {wizardContent}
      </VerificationCenter>

      <SupportChatModal
        visible={supportChatOpen}
        userId={user.id}
        onClose={() => setSupportChatOpen(false)}
      />
    </Screen>
  )
}

function SupportChatModal({
  visible,
  userId,
  onClose,
}: {
  visible: boolean
  userId: string
  onClose: () => void
}) {
  const { colors } = useTheme()
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <ChatThreadPanel threadId={supportThreadId(userId)} onBack={onClose} />
      </SafeAreaView>
    </Modal>
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
    idTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    addressInput: { marginBottom: spacing.sm },
    upload: {
      minHeight: 120,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.gray200,
      borderRadius: radius.md,
      backgroundColor: colors.gray50,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.sm,
    },
    uploadDone: { borderStyle: 'solid', borderColor: colors.green, backgroundColor: colors.greenBg },
    uploadText: { fontSize: 15, fontWeight: '500', color: colors.gray500 },
    uploadTextDone: { color: colors.green },
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
    },
  })
}
