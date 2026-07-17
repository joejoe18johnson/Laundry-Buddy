import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { IdDocumentCapture } from '../../components/IdDocumentCapture'
import { AppIcon } from '../../components/AppIcon'
import {
  AppTextInput,
  ChoiceChip,
  GhostButton,
  PrimaryButton,
  Screen,
  StepIndicator,
} from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import {
  formatIdDocumentType,
  getIdentityVerification,
  identityVerificationSteps,
} from '../../lib/identityVerification'
import { normalizePhone } from '../../lib/phone'
import {
  buildVerificationCodeRequestMessage,
  openSupportWhatsApp,
} from '../../lib/whatsapp'
import {
  formatWhatsAppNumberDisplay,
  isValidWhatsAppNumber,
} from '../../lib/whatsappVerification'
import { colors, radius, spacing } from '../../theme'
import { toTitleCase } from '../../lib/titleCase'
import type { IdDocumentType } from '../../types'

type WizardStep = 'phone' | 'id' | 'address'

export function IdentityVerificationScreen() {
  const { user, submitIdentityVerification, logout, authError, clearAuthError } = useAuth()
  const [step, setStep] = useState<WizardStep>('phone')
  const [phone, setPhone] = useState('')
  const [idType, setIdType] = useState<IdDocumentType | null>(null)
  const [idPhotoUri, setIdPhotoUri] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [addressUploaded, setAddressUploaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const verification = user ? getIdentityVerification(user) : null
  const isHost = user?.role === 'host'
  const steps = useMemo(() => identityVerificationSteps(user?.role ?? 'customer'), [user?.role])
  const stepIndex = step === 'phone' ? 0 : step === 'id' ? 1 : 2

  useEffect(() => {
    if (!user?.phone) return
    setPhone((current) => current || user.phone!.replace(/^501/, ''))
  }, [user?.phone])

  if (!user || !verification) return null

  if (verification.status === 'pending') {
    return (
      <Screen>
        <View style={styles.pillPending}>
          <AppIcon name="clock" size={12} color="#b8860b" />
          <Text style={styles.pillPendingText}>{toTitleCase('Under review')}</Text>
        </View>
        <Text style={styles.title}>{toTitleCase('Verification submitted')}</Text>
        <Text style={styles.subtitle}>
          {toTitleCase(
            'We sent a verification code to your WhatsApp. Reply to us on WhatsApp with that code so we can approve your account.',
          )}
        </Text>
        <View style={styles.whatsAppHint}>
          <AppIcon name="message-circle" size={18} color={colors.gray600} />
          <Text style={styles.whatsAppHintText}>
            {toTitleCase('Waiting for your code reply on WhatsApp before we unlock the app.')}
          </Text>
        </View>
        <View style={styles.checklist}>
          <ChecklistItem
            title="WhatsApp number"
            sub={formatWhatsAppNumberDisplay(verification.verifiedPhone ?? user.phone ?? '')}
          />
          <ChecklistItem
            title={formatIdDocumentType(verification.idType)}
            sub={verification.idUploaded ? toTitleCase('Uploaded') : toTitleCase('Missing')}
          />
          {isHost && verification.address ? (
            <ChecklistItem title="Host address" sub={verification.address} />
          ) : null}
        </View>
        <PrimaryButton
          title="Reply on WhatsApp"
          icon="message-circle"
          full
          onPress={() =>
            openSupportWhatsApp(
              `Hi Laundry Buddy! This is ${user.name}. Here is my verification code: `,
            )
          }
        />
        <GhostButton title="Log out" icon="log-out" onPress={logout} full />
      </Screen>
    )
  }

  const phoneReady = isValidWhatsAppNumber(phone)
  const idReady = !!idType && !!idPhotoUri
  const addressReady = !isHost || (address.trim().length > 0 && addressUploaded)

  const handleOpenWhatsApp = () => {
    clearAuthError()
    if (!phoneReady || !user) return
    openSupportWhatsApp(buildVerificationCodeRequestMessage(user.name, normalizePhone(phone)))
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

  const isRejected = verification.status === 'rejected'

  return (
    <Screen>
      <View style={styles.pill}>
        <AppIcon name="shield" size={12} color={colors.gray600} />
        <Text style={styles.pillText}>
          {toTitleCase(isHost ? 'Host verification' : 'Guest verification')}
        </Text>
      </View>
      <Text style={styles.title}>{toTitleCase('Verify your identity')}</Text>
      <Text style={styles.subtitle}>
        {isRejected
          ? toTitleCase('Your previous submission was declined. Please resubmit clear documents.')
          : toTitleCase(
              'Add your WhatsApp number and government ID. We send a code on WhatsApp — reply to us with it to finish verification.',
            )}
      </Text>

      <StepIndicator steps={steps} current={stepIndex} />

      {step === 'phone' && (
        <View style={styles.stepBlock}>
          <View style={styles.sectionHeader}>
            <AppIcon name="message-circle" size={18} />
            <Text style={styles.sectionTitle}>{toTitleCase('WhatsApp number')}</Text>
          </View>
          <Text style={styles.sectionSub}>
            {toTitleCase(
              'Use the WhatsApp number where we can reach you. We send your verification code there — reply to us on WhatsApp with that code.',
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
          <PrimaryButton
            title="Request code on WhatsApp"
            icon="message-circle"
            full
            disabled={!phoneReady}
            onPress={handleOpenWhatsApp}
          />
          <Text style={styles.sectionSub}>
            {toTitleCase(
              'This opens WhatsApp to Laundry Buddy support. After we send your code, reply in that chat with the code.',
            )}
          </Text>
          <PrimaryButton
            title="Continue"
            icon="arrow-right"
            full
            disabled={!phoneReady}
            onPress={handleContinueFromPhone}
          />
        </View>
      )}

      {step === 'id' && (
        <View style={styles.stepBlock}>
          <View style={styles.sectionHeader}>
            <AppIcon name="credit-card" size={18} />
            <Text style={styles.sectionTitle}>{toTitleCase('Government ID')}</Text>
          </View>
          <Text style={styles.sectionSub}>
            {toTitleCase('Choose one document type and upload a clear photo.')}
          </Text>
          <View style={styles.idTypeRow}>
            <ChoiceChip
              label="Passport"
              selected={idType === 'passport'}
              onPress={() => setIdType('passport')}
            />
            <ChoiceChip
              label="Social Security"
              selected={idType === 'social_security'}
              onPress={() => setIdType('social_security')}
            />
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
          <View style={styles.stepActions}>
            <GhostButton title="Back" icon="arrow-left" onPress={() => setStep('phone')} />
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title={isHost ? 'Continue' : 'Submit verification'}
                icon={isHost ? 'arrow-right' : 'check-circle'}
                full
                disabled={!idReady || submitting}
                onPress={handleContinueFromId}
              />
            </View>
          </View>
        </View>
      )}

      {step === 'address' && isHost && (
        <View style={styles.stepBlock}>
          <View style={styles.sectionHeader}>
            <AppIcon name="home" size={18} />
            <Text style={styles.sectionTitle}>{toTitleCase('Host address')}</Text>
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
          <View style={styles.stepActions}>
            <GhostButton title="Back" icon="arrow-left" onPress={() => setStep('id')} />
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Submit verification"
                icon="check-circle"
                full
                disabled={!addressReady || submitting}
                onPress={() => void handleSubmit()}
              />
            </View>
          </View>
        </View>
      )}

      {authError ? <Text style={styles.error}>{authError}</Text> : null}

      <GhostButton title="Log out" icon="log-out" onPress={logout} full />
    </Screen>
  )
}

function ChecklistItem({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={styles.checkItem}>
      <View style={styles.checkIcon}>
        <AppIcon name="check" size={14} color={colors.white} />
      </View>
      <View>
        <Text style={styles.checkTitle}>{toTitleCase(title)}</Text>
        <Text style={styles.checkSub}>{sub}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', marginBottom: spacing.sm, lineHeight: 34, color: colors.black },
  subtitle: { fontSize: 15, color: colors.gray500, lineHeight: 24, marginBottom: spacing.lg },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.gray600 },
  pillPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#fff8e6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  pillPendingText: { fontSize: 12, fontWeight: '600', color: '#b8860b' },
  stepBlock: { gap: spacing.md, marginTop: spacing.lg, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.black },
  sectionSub: { fontSize: 13, color: colors.gray500, lineHeight: 20 },
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
  whatsAppHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  whatsAppHintText: { flex: 1, fontSize: 14, color: colors.gray600, lineHeight: 20 },
  idTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stepActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
  checklist: { gap: spacing.md, marginVertical: spacing.lg },
  checkItem: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.md,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTitle: { fontSize: 15, fontWeight: '600', lineHeight: 20, color: colors.black },
  checkSub: { fontSize: 13, color: colors.gray500, marginTop: spacing.sm, lineHeight: 18 },
  error: {
    color: colors.danger,
    backgroundColor: '#fef2f2',
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    fontSize: 14,
    lineHeight: 20,
  },
})
