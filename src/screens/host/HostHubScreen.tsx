import { useEffect, useState, type ReactNode } from 'react'
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, PrimaryButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { getHostByUserId, getHostProfileDetails } from '../../data/mockData'
import { formatHostPrice } from '../../lib/hostFilters'
import { getHostPaymentMethods, normalizeHostSettings, PAYMENT_METHOD_LABELS } from '../../lib/hostSettingsStorage'
import { parsePriceInput } from '../../lib/hostPricing'
import { colors, radius, spacing } from '../../theme'
import type { HostSettings } from '../../types'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  )
}

function Row({
  icon,
  label,
  value,
}: {
  icon: 'map-pin' | 'dollar-sign' | 'wind' | 'phone' | 'mail' | 'shield'
  label: string
  value: string
}) {
  return (
    <View style={styles.row}>
      <AppIcon name={icon} size={16} color={colors.gray500} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  )
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string
  sub?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub ? <Text style={styles.toggleSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.gray200, true: colors.green }}
        thumbColor={colors.white}
      />
    </View>
  )
}

export function HostHubScreen() {
  const { user } = useAuth()
  const {
    navigate,
    hostSettings,
    updateHostSettings,
    hostStats,
    hostRequests,
    activeLoads,
  } = useApp()

  const host = user ? getHostByUserId(user.id) : null

  const [draft, setDraft] = useState<HostSettings>(() =>
    normalizeHostSettings(hostSettings, host),
  )
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!hostSettings || !user) return
    const h = getHostByUserId(user.id)
    setDraft(normalizeHostSettings(hostSettings, h))
  }, [hostSettings, user])

  if (!user) return null

  const profile = host ? getHostProfileDetails(host.id) : null
  const verification = user.hostVerification
  const pricing = draft.pricing

  const patch = (partial: Partial<HostSettings>) => {
    setDraft((prev) => normalizeHostSettings({ ...prev, ...partial }, host))
    setSaved(false)
  }

  const patchPricing = (partial: Partial<HostSettings['pricing']>) => {
    setDraft((prev) => {
      const base = normalizeHostSettings(prev, host)
      return normalizeHostSettings({ ...base, pricing: { ...base.pricing, ...partial } }, host)
    })
    setSaved(false)
  }

  const patchBank = (field: keyof HostSettings['bankDetails'], value: string) => {
    setDraft((prev) => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value },
    }))
    setSaved(false)
  }

  const handleOnlineToggle = async (online: boolean) => {
    const next = { ...draft, isOnline: online }
    setDraft(next)
    await updateHostSettings(next)
  }

  const handleSave = async () => {
    await updateHostSettings(draft)
    setSaved(true)
  }

  const paymentSummary = [
    draft.acceptCash ? PAYMENT_METHOD_LABELS.cash : null,
    draft.acceptBankTransfer ? PAYMENT_METHOD_LABELS.bank_transfer : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Screen>
      <BackButton onPress={() => navigate('host-dashboard')} label="Dashboard" />
      <View style={styles.titleRow}>
        <AppIcon name="user" size={22} />
        <Text style={styles.title}>Host profile</Text>
      </View>
      <Text style={styles.subtitle}>Everything about your listing in one place</Text>

      <View style={[styles.onlineCard, draft.isOnline ? styles.onlineCardLive : styles.onlineCardOff]}>
        <View style={styles.onlineHeader}>
          <View style={[styles.onlineDot, draft.isOnline && styles.onlineDotLive]} />
          <View style={styles.onlineText}>
            <Text style={styles.onlineTitle}>{draft.isOnline ? 'You are online' : 'You are offline'}</Text>
            <Text style={styles.onlineSub}>
              {draft.isOnline
                ? 'Guests can find and book your dryer right now.'
                : 'Go online when you are ready to accept loads.'}
            </Text>
          </View>
          <Switch
            value={draft.isOnline}
            onValueChange={handleOnlineToggle}
            trackColor={{ false: colors.gray200, true: colors.green }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{hostStats.loadsToday}</Text>
          <Text style={styles.statLabel}>Loads today</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{hostRequests.length}</Text>
          <Text style={styles.statLabel}>Requests</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{activeLoads.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {host && (
        <Section title="Listing">
          <Row icon="map-pin" label="Location" value={`${host.location}${host.district ? ` · ${host.district}` : ''}`} />
          <Row icon="wind" label="Dryer" value={`${host.dryerType} · ~${host.turnaroundHours} hr · ${host.slotsLeft} slots`} />
          {profile ? (
            <Row icon="shield" label="Rating" value={`${host.rating > 0 ? host.rating.toFixed(1) : 'New'} · ${profile.loadsHosted} loads hosted`} />
          ) : null}
          <Text style={styles.rulesTitle}>House rules</Text>
          {host.rules.map((rule) => (
            <Text key={rule} style={styles.ruleItem}>· {rule}</Text>
          ))}
        </Section>
      )}

      <Section title="Your prices">
        <Text style={styles.sectionHint}>
          You control what you charge. Guests see these rates when booking. Set folding to $0 to hide that service.
        </Text>
        <View style={styles.priceField}>
          <Text style={styles.priceLabel}>Drying (per load)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(pricing.dryPrice)}
            onChangeText={(v) => patchPricing({ dryPrice: parsePriceInput(v) })}
          />
        </View>
        <View style={styles.priceField}>
          <Text style={styles.priceLabel}>Folding service (per load)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(pricing.foldingPrice)}
            onChangeText={(v) => patchPricing({ foldingPrice: parsePriceInput(v) })}
          />
        </View>
        <View style={styles.priceField}>
          <Text style={styles.priceLabel}>Dryer sheets (if guest buys)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(pricing.sheetsPrice)}
            onChangeText={(v) => patchPricing({ sheetsPrice: parsePriceInput(v) })}
          />
        </View>
        <Text style={styles.paymentSummary}>
          Guests see: Dry {formatHostPrice(pricing.dryPrice)}
          {pricing.foldingPrice > 0 ? ` · Folding ${formatHostPrice(pricing.foldingPrice)}` : ''}
          {' · Sheets '}{formatHostPrice(pricing.sheetsPrice)}
        </Text>
      </Section>

      <Section title="Payments">
        <Text style={styles.sectionHint}>Choose how guests can pay you.</Text>
        <ToggleRow
          label="Accept cash"
          sub="Guest pays in person at drop-off or pickup"
          value={draft.acceptCash}
          onChange={(v) => patch({ acceptCash: v })}
        />
        <ToggleRow
          label="Accept bank transfer"
          sub="Share your bank details with guests who choose transfer"
          value={draft.acceptBankTransfer}
          onChange={(v) => patch({ acceptBankTransfer: v })}
        />
        {draft.acceptBankTransfer && (
          <View style={styles.bankForm}>
            <Text style={styles.bankTitle}>Bank details for guests</Text>
            <TextInput
              style={styles.input}
              placeholder="Bank name"
              value={draft.bankDetails.bankName}
              onChangeText={(v) => patchBank('bankName', v)}
            />
            <TextInput
              style={styles.input}
              placeholder="Account holder name"
              value={draft.bankDetails.accountName}
              onChangeText={(v) => patchBank('accountName', v)}
            />
            <TextInput
              style={styles.input}
              placeholder="Account number"
              value={draft.bankDetails.accountNumber}
              onChangeText={(v) => patchBank('accountNumber', v)}
              keyboardType="number-pad"
            />
          </View>
        )}
        {paymentSummary ? (
          <Text style={styles.paymentSummary}>Guests will see: {paymentSummary}</Text>
        ) : (
          <Text style={styles.paymentWarning}>Enable at least one payment method.</Text>
        )}
      </Section>

      <Section title="Notifications">
        <ToggleRow
          label="New booking requests"
          sub="Alert when a guest wants to book"
          value={draft.notifyNewRequests}
          onChange={(v) => patch({ notifyNewRequests: v })}
        />
        <ToggleRow
          label="Load status updates"
          sub="When loads move to drying or ready"
          value={draft.notifyBookingUpdates}
          onChange={(v) => patch({ notifyBookingUpdates: v })}
        />
        <ToggleRow
          label="Notify guests when I go online"
          sub="Let nearby guests know you are available"
          value={draft.notifyGuestsWhenOnline}
          onChange={(v) => patch({ notifyGuestsWhenOnline: v })}
        />
      </Section>

      <Section title="Account">
        <Row icon="phone" label="Phone" value={user.phone ?? '—'} />
        <Row icon="mail" label="Email" value={user.email ?? '—'} />
        {verification?.address ? (
          <Row icon="map-pin" label="Verified address" value={verification.address} />
        ) : null}
      </Section>

      <Pressable style={styles.reputationCard} onPress={() => navigate('help')}>
        <AppIcon name="award" size={18} />
        <View style={styles.reputationCardText}>
          <Text style={styles.reputationCardTitle}>Log every sale — build your reputation</Text>
          <Text style={styles.reputationCardBody}>
            More completed loads on the app means higher search visibility. Read the host FAQ on why
            off-platform deals hurt your standing.
          </Text>
        </View>
        <AppIcon name="chevron-right" size={18} color={colors.gray400} />
      </Pressable>

      <View style={styles.actions}>
        <PrimaryButton title={saved ? 'Saved' : 'Save changes'} onPress={handleSave} full />
        <Pressable style={styles.linkBtn} onPress={() => navigate('host-dashboard')}>
          <AppIcon name="home" size={16} />
          <Text style={styles.linkText}>Back to dashboard</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={() => navigate('history')}>
          <AppIcon name="clock" size={16} />
          <Text style={styles.linkText}>Load history</Text>
        </Pressable>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
  onlineCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  onlineCardLive: { backgroundColor: colors.greenBg, borderColor: colors.green },
  onlineCardOff: { backgroundColor: colors.gray50, borderColor: colors.gray200 },
  onlineHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gray400 },
  onlineDotLive: { backgroundColor: colors.green },
  onlineText: { flex: 1, gap: 2 },
  onlineTitle: { fontSize: 16, fontWeight: '700' },
  onlineSub: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statNum: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: colors.gray500, fontWeight: '600' },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionHint: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 12, color: colors.gray500, fontWeight: '500' },
  rowValue: { fontSize: 15, color: colors.black, lineHeight: 21 },
  rulesTitle: { fontSize: 12, color: colors.gray500, fontWeight: '600', marginTop: spacing.sm },
  ruleItem: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 4,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { fontSize: 15, fontWeight: '600' },
  toggleSub: { fontSize: 12, color: colors.gray500, lineHeight: 17 },
  bankForm: { gap: spacing.sm, marginTop: spacing.sm },
  bankTitle: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
  },
  priceField: { gap: spacing.sm },
  priceLabel: { fontSize: 14, fontWeight: '600', color: colors.gray600 },
  paymentSummary: { fontSize: 13, color: colors.green, fontWeight: '600' },
  paymentWarning: { fontSize: 13, color: colors.danger, fontWeight: '500' },
  reputationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.gray50,
  },
  reputationCardText: { flex: 1, gap: 4 },
  reputationCardTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  reputationCardBody: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
  actions: { gap: spacing.sm, marginBottom: spacing.xl },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  linkText: { fontSize: 15, fontWeight: '600', color: colors.gray600 },
})
