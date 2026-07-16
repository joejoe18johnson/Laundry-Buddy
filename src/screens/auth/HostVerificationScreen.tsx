import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { AppTextInput, GhostButton, PrimaryButton, Screen } from '../../components/ui'
import { AppIcon } from '../../components/AppIcon'
import { colors, radius, spacing } from '../../theme'

export function HostVerificationScreen() {
  const { user, submitHostVerification, logout } = useAuth()
  const [address, setAddress] = useState('')
  const [idUploaded, setIdUploaded] = useState(false)
  const [addressUploaded, setAddressUploaded] = useState(false)

  if (!user) return null

  const status = user.hostVerification?.status ?? 'none'
  const isPending = status === 'pending'
  const isRejected = status === 'rejected'
  const canSubmit = address.trim().length > 0 && idUploaded && addressUploaded && !isPending

  if (isPending) {
    return (
      <Screen>
        <View style={styles.pillPending}>
          <AppIcon name="clock" size={12} color="#b8860b" />
          <Text style={styles.pillPendingText}>Under review</Text>
        </View>
        <Text style={styles.title}>Verification submitted</Text>
        <Text style={styles.subtitle}>
          We're reviewing your ID and address proof. This usually takes 24 hours.
        </Text>
        <View style={styles.checklist}>
          <View style={styles.checkItem}>
            <View style={styles.checkIcon}>
              <AppIcon name="check" size={14} color={colors.white} />
            </View>
            <View>
              <Text style={styles.checkTitle}>Government ID</Text>
              <Text style={styles.checkSub}>Uploaded</Text>
            </View>
          </View>
          <View style={styles.checkItem}>
            <View style={styles.checkIcon}>
              <AppIcon name="check" size={14} color={colors.white} />
            </View>
            <View>
              <Text style={styles.checkTitle}>Address proof</Text>
              <Text style={styles.checkSub}>{user.hostVerification?.address}</Text>
            </View>
          </View>
        </View>
        <GhostButton title="Log out" icon="log-out" onPress={logout} full />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.pill}>
        <AppIcon name="shield" size={12} color={colors.gray600} />
        <Text style={styles.pillText}>Host verification</Text>
      </View>
      <Text style={styles.title}>Verify your identity</Text>
      <Text style={styles.subtitle}>
        {isRejected
          ? 'Your previous submission was rejected. Please resubmit clear documents.'
          : 'Upload your ID and proof of address so guests can trust your listing.'}
      </Text>

      <View style={styles.sectionHeader}>
        <AppIcon name="credit-card" size={18} />
        <Text style={styles.sectionTitle}>Government ID</Text>
      </View>
      <Text style={styles.sectionSub}>Passport, social security card, or driver's license</Text>
      <Pressable
        onPress={() => setIdUploaded(true)}
        style={[styles.upload, idUploaded && styles.uploadDone]}
      >
        <AppIcon name={idUploaded ? 'check-circle' : 'upload'} size={24} color={idUploaded ? colors.green : colors.gray500} />
        <Text style={[styles.uploadText, idUploaded && styles.uploadTextDone]}>
          {idUploaded ? 'ID uploaded' : 'Upload ID photo'}
        </Text>
      </Pressable>

      <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
        <AppIcon name="home" size={18} />
        <Text style={styles.sectionTitle}>Home address</Text>
      </View>
      <AppTextInput
        style={styles.addressInput}
        placeholder="22 Coconut St., Las Flores"
        value={address}
        onChangeText={setAddress}
      />
      <Text style={styles.sectionSub}>Utility bill or lease in your name</Text>
      <Pressable
        onPress={() => setAddressUploaded(true)}
        style={[styles.upload, addressUploaded && styles.uploadDone]}
      >
        <AppIcon name={addressUploaded ? 'check-circle' : 'upload'} size={24} color={addressUploaded ? colors.green : colors.gray500} />
        <Text style={[styles.uploadText, addressUploaded && styles.uploadTextDone]}>
          {addressUploaded ? 'Address proof uploaded' : 'Upload address proof'}
        </Text>
      </Pressable>

      <View style={{ height: spacing.lg }} />
      <PrimaryButton
        title="Submit for review"
        icon="send"
        onPress={() => submitHostVerification({ address, idUploaded, addressUploaded })}
        disabled={!canSubmit}
        full
      />
      <View style={{ height: spacing.md }} />
      <GhostButton title="Log out" icon="log-out" onPress={logout} full />
    </Screen>
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.black },
  sectionSub: { fontSize: 13, color: colors.gray500, marginBottom: spacing.md, lineHeight: 20 },
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
    marginTop: spacing.sm,
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
})
