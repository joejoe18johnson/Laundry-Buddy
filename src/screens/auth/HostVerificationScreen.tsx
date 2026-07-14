import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { GhostButton, PrimaryButton, Screen } from '../../components/ui'
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
          <Text style={styles.pillPendingText}>Under review</Text>
        </View>
        <Text style={styles.title}>Verification submitted</Text>
        <Text style={styles.subtitle}>
          We're reviewing your ID and address proof. This usually takes 24 hours.
        </Text>
        <View style={styles.checklist}>
          <View style={styles.checkItem}>
            <Text style={styles.checkIcon}>✓</Text>
            <View>
              <Text style={styles.checkTitle}>Government ID</Text>
              <Text style={styles.checkSub}>Uploaded</Text>
            </View>
          </View>
          <View style={styles.checkItem}>
            <Text style={styles.checkIcon}>✓</Text>
            <View>
              <Text style={styles.checkTitle}>Address proof</Text>
              <Text style={styles.checkSub}>{user.hostVerification?.address}</Text>
            </View>
          </View>
        </View>
        <GhostButton title="Log out" onPress={logout} full />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.pill}>
        <Text style={styles.pillText}>Host verification</Text>
      </View>
      <Text style={styles.title}>Verify your identity</Text>
      <Text style={styles.subtitle}>
        {isRejected
          ? 'Your previous submission was rejected. Please resubmit clear documents.'
          : 'Upload your ID and proof of address so guests can trust your listing.'}
      </Text>

      <Text style={styles.sectionTitle}>Government ID</Text>
      <Text style={styles.sectionSub}>Passport, social security card, or driver's license</Text>
      <Pressable
        onPress={() => setIdUploaded(true)}
        style={[styles.upload, idUploaded && styles.uploadDone]}
      >
        <Text style={[styles.uploadText, idUploaded && styles.uploadTextDone]}>
          {idUploaded ? '✓ ID uploaded' : 'Upload ID photo'}
        </Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Home address</Text>
      <TextInput
        style={styles.input}
        placeholder="22 Coconut St., Las Flores"
        value={address}
        onChangeText={setAddress}
      />
      <Text style={styles.sectionSub}>Utility bill or lease in your name</Text>
      <Pressable
        onPress={() => setAddressUploaded(true)}
        style={[styles.upload, addressUploaded && styles.uploadDone]}
      >
        <Text style={[styles.uploadText, addressUploaded && styles.uploadTextDone]}>
          {addressUploaded ? '✓ Address proof uploaded' : 'Upload address proof'}
        </Text>
      </Pressable>

      <View style={{ height: spacing.lg }} />
      <PrimaryButton
        title="Submit for review"
        onPress={() => submitHostVerification({ address, idUploaded, addressUploaded })}
        disabled={!canSubmit}
        full
      />
      <View style={{ height: spacing.md }} />
      <GhostButton title="Log out" onPress={logout} full />
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.gray500, lineHeight: 22, marginBottom: 24 },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray50,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 12,
  },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.gray600 },
  pillPending: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff8e6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 12,
  },
  pillPendingText: { fontSize: 12, fontWeight: '600', color: '#b8860b' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  sectionSub: { fontSize: 13, color: colors.gray500, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.sm,
    padding: 14,
    fontSize: 16,
    marginBottom: 8,
  },
  upload: {
    minHeight: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray200,
    borderRadius: radius.md,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  uploadDone: { borderStyle: 'solid', borderColor: colors.green, backgroundColor: colors.greenBg },
  uploadText: { fontSize: 15, fontWeight: '500', color: colors.gray500 },
  uploadTextDone: { color: colors.green },
  checklist: { gap: 12, marginVertical: 24 },
  checkItem: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.md,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.green,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
  },
  checkTitle: { fontSize: 15, fontWeight: '600' },
  checkSub: { fontSize: 13, color: colors.gray500, marginTop: 2 },
})
