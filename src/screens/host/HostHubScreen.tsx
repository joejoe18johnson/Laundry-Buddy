import { useEffect, useState, type ReactNode } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { BackButton, BrandSwitch, PrimaryButton, Screen, StickySaveBar, ChoiceChip } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getHostByUserId, getHostProfileDetails } from '../../data/mockData'
import { formatHostPrice } from '../../lib/hostFilters'
import { getHostPaymentMethods, normalizeHostSettings, PAYMENT_METHOD_LABELS } from '../../lib/hostSettingsStorage'
import { DropOffHourGrid } from '../../components/DropOffHourGrid'
import { parseListingInt } from '../../lib/hostListing'
import { parsePriceInput } from '../../lib/hostPricing'
import { formatTurnaroundHours, TURNAROUND_HOUR_OPTIONS } from '../../lib/turnaroundTime'
import { formatDropOffAvailability } from '../../lib/dropOffAvailability'
import { colors, radius, spacing } from '../../theme'
import type { DropOffHour, HostListing, HostSettings } from '../../types'

function EditableLineList({
  label,
  hint,
  items,
  placeholder,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string
  hint?: string
  items: string[]
  placeholder: string
  onChange: (index: number, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  return (
    <View style={styles.lineList}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      {items.map((item, index) => (
        <View key={`${label}-${index}`} style={styles.lineRow}>
          <TextInput
            style={[styles.input, styles.lineInput]}
            value={item}
            onChangeText={(v) => onChange(index, v)}
            placeholder={placeholder}
            placeholderTextColor={colors.gray400}
          />
          <Pressable onPress={() => onRemove(index)} hitSlop={8} style={styles.removeBtn}>
            <AppIcon name="x" size={18} color={colors.gray500} />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={onAdd} style={styles.addLineBtn}>
        <AppIcon name="plus" size={16} />
        <Text style={styles.addLineText}>Add line</Text>
      </Pressable>
    </View>
  )
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: 'default' | 'number-pad' | 'phone-pad'
  multiline?: boolean
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray400}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  )
}

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
      <BrandSwitch
        value={value}
        onValueChange={onChange}
        accent="black"
      />
    </View>
  )
}

export function HostHubScreen() {
  const {
    user,
    biometricSupport,
    biometricEnabled,
    enableBiometricLogin,
    disableBiometricLogin,
  } = useAuth()
  const { showToast } = useToast()
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
  const [saved, setSaved] = useState(true)

  useEffect(() => {
    if (!hostSettings || !user) return
    const h = getHostByUserId(user.id)
    setDraft(normalizeHostSettings(hostSettings, h))
    setSaved(true)
  }, [hostSettings, user])

  if (!user) return null

  const profile = host ? getHostProfileDetails(host.id) : null
  const verification = user.hostVerification
  const pricing = draft.pricing
  const listing = draft.listing

  const patchListing = (partial: Partial<HostListing>) => {
    setDraft((prev) => {
      const base = normalizeHostSettings(prev, host)
      return normalizeHostSettings({ ...base, listing: { ...base.listing, ...partial } }, host)
    })
    setSaved(false)
  }

  const patchListingList = (key: 'setup' | 'rules', index: number, value: string) => {
    setDraft((prev) => {
      const base = normalizeHostSettings(prev, host)
      const next = [...base.listing[key]]
      next[index] = value
      return normalizeHostSettings({ ...base, listing: { ...base.listing, [key]: next } }, host)
    })
    setSaved(false)
  }

  const addListingLine = (key: 'setup' | 'rules') => {
    setDraft((prev) => {
      const base = normalizeHostSettings(prev, host)
      return normalizeHostSettings(
        { ...base, listing: { ...base.listing, [key]: [...base.listing[key], ''] } },
        host,
      )
    })
    setSaved(false)
  }

  const removeListingLine = (key: 'setup' | 'rules', index: number) => {
    setDraft((prev) => {
      const base = normalizeHostSettings(prev, host)
      const next = base.listing[key].filter((_, i) => i !== index)
      return normalizeHostSettings({ ...base, listing: { ...base.listing, [key]: next } }, host)
    })
    setSaved(false)
  }
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

  const toggleDropOff = (hours: DropOffHour[]) => {
    setDraft((prev) => {
      const base = normalizeHostSettings(prev, host)
      return normalizeHostSettings({ ...base, dropOffAvailability: hours }, host)
    })
    setSaved(false)
  }

  const handleOnlineToggle = async (online: boolean) => {
    const next = { ...draft, isOnline: online }
    setDraft(next)
    await updateHostSettings(next)
  }

  const handleSave = async () => {
    const cleaned: HostSettings = {
      ...draft,
      listing: {
        ...draft.listing,
        setup: draft.listing.setup.map((s) => s.trim()).filter(Boolean),
        rules: draft.listing.rules.map((s) => s.trim()).filter(Boolean),
      },
    }
    setDraft(cleaned)
    await updateHostSettings(cleaned)
    setSaved(true)
    showToast('Host profile saved', { icon: 'check' })
  }

  const paymentSummary = [
    draft.acceptCash ? PAYMENT_METHOD_LABELS.cash : null,
    draft.acceptBankTransfer ? PAYMENT_METHOD_LABELS.bank_transfer : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <View style={styles.hubWrap}>
    <Screen style={!saved ? styles.hubScrollWithBar : undefined}>
      <BackButton onPress={() => navigate('host-dashboard')} label="Dashboard" />
      <View style={styles.titleRow}>
        <AppIcon name="user" size={22} />
        <Text style={styles.title}>Host profile</Text>
      </View>
      <Text style={styles.subtitle}>Edit your listing — guests see this when they browse and book</Text>

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
          <BrandSwitch
            value={draft.isOnline}
            onValueChange={handleOnlineToggle}
            accent="green"
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

      {host && profile ? (
        <Section title="Stats">
          <Row
            icon="shield"
            label="Rating"
            value={`${host.rating > 0 ? host.rating.toFixed(1) : 'New'} · ${profile.loadsHosted} loads hosted`}
          />
        </Section>
      ) : null}

      <Section title="Drop-off availability">
        <Text style={styles.sectionHint}>
          Tap the hours between 8am and 8pm when guests can drop off laundry.
        </Text>
        <DropOffHourGrid
          mode="toggle"
          value={draft.dropOffAvailability}
          onChange={toggleDropOff}
        />
        <Text style={styles.paymentSummary}>
          Guests can book: {formatDropOffAvailability(draft.dropOffAvailability)}
        </Text>
        {draft.dropOffAvailability.length === 1 && (
          <Text style={styles.availabilityNote}>At least one hour must stay on.</Text>
        )}
      </Section>

      <Section title="About you">
        <Text style={styles.sectionHint}>Tell guests about yourself and your laundry setup.</Text>
        <Field
          label="Bio"
          value={listing.bio}
          onChangeText={(v) => patchListing({ bio: v })}
          placeholder="Share a short intro guests will see on your profile"
          multiline
        />
      </Section>

      <Section title="Listing details">
        <Text style={styles.sectionHint}>Location and contact info guests need for drop-off.</Text>
        <Field
          label="Area / neighborhood"
          value={listing.location}
          onChangeText={(v) => patchListing({ location: v })}
          placeholder="e.g. Las Flores"
        />
        <Field
          label="District / region"
          value={listing.district}
          onChangeText={(v) => patchListing({ district: v })}
          placeholder="e.g. Cayo"
        />
        <Field
          label="Street address"
          value={listing.address}
          onChangeText={(v) => patchListing({ address: v })}
          placeholder="Full address for booked guests"
        />
        <Field
          label="Gate code or directions"
          value={listing.gateCode}
          onChangeText={(v) => patchListing({ gateCode: v })}
          placeholder="Gate code, buzzer, or landmark"
        />
        <Field
          label="WhatsApp number"
          value={listing.whatsapp}
          onChangeText={(v) => patchListing({ whatsapp: v })}
          placeholder="5016001234"
          keyboardType="phone-pad"
        />
        <Text style={styles.fieldLabel}>Dry time (standard load)</Text>
        <View style={styles.turnaroundRow}>
          {TURNAROUND_HOUR_OPTIONS.map((hours) => (
            <ChoiceChip
              key={hours}
              label={formatTurnaroundHours(hours)}
              selected={listing.turnaroundHours === hours}
              onPress={() => patchListing({ turnaroundHours: hours })}
              size="compact"
            />
          ))}
        </View>
        <Field
          label="Open slots"
          value={String(listing.slotsLeft)}
          onChangeText={(v) =>
            patchListing({ slotsLeft: parseListingInt(v, listing.slotsLeft) })
          }
          keyboardType="number-pad"
        />
        <ToggleRow
          label="Generator backup"
          sub="Show guests you can run during power outages"
          value={listing.hasGenerator}
          onChange={(v) => patchListing({ hasGenerator: v })}
        />
      </Section>

      <Section title="Your setup">
        <EditableLineList
          label="Setup highlights"
          hint="Describe your laundry space — guests see these on your profile."
          items={listing.setup}
          placeholder="e.g. Covered porch drop-off"
          onChange={(i, v) => patchListingList('setup', i, v)}
          onAdd={() => addListingLine('setup')}
          onRemove={(i) => removeListingLine('setup', i)}
        />
      </Section>

      <Section title="House rules">
        <EditableLineList
          label="Rules for guests"
          hint="Set expectations for drop-off, pickup, and care of laundry."
          items={listing.rules}
          placeholder="e.g. Pick up within 24 hrs"
          onChange={(i, v) => patchListingList('rules', i, v)}
          onAdd={() => addListingLine('rules')}
          onRemove={(i) => removeListingLine('rules', i)}
        />
      </Section>

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
              placeholderTextColor={colors.gray400}
              value={draft.bankDetails.bankName}
              onChangeText={(v) => patchBank('bankName', v)}
            />
            <TextInput
              style={styles.input}
              placeholder="Account holder name"
              placeholderTextColor={colors.gray400}
              value={draft.bankDetails.accountName}
              onChangeText={(v) => patchBank('accountName', v)}
            />
            <TextInput
              style={styles.input}
              placeholder="Account number"
              placeholderTextColor={colors.gray400}
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
        {biometricSupport.available ? (
          <ToggleRow
            label={`${biometricSupport.label} sign-in`}
            sub="Unlock quickly without typing your password"
            value={biometricEnabled}
            onChange={(next) => {
              if (next) void enableBiometricLogin()
              else void disableBiometricLogin()
            }}
          />
        ) : null}
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
    {!saved && (
      <View style={styles.stickySaveWrap}>
        <StickySaveBar onSave={() => void handleSave()} />
      </View>
    )}
    </View>
  )
}

const styles = StyleSheet.create({
  hubWrap: { flex: 1, backgroundColor: colors.white },
  hubScrollWithBar: { paddingBottom: 100 },
  stickySaveWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
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
    textTransform: 'capitalize',
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
  field: { gap: spacing.sm },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.gray600 },
  turnaroundRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  inputMultiline: { minHeight: 100, paddingTop: 12 },
  twoCol: { flexDirection: 'row', gap: spacing.sm },
  col: { flex: 1 },
  lineList: { gap: spacing.sm },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lineInput: { flex: 1 },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  addLineText: { fontSize: 14, fontWeight: '600', color: colors.black },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 4,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: colors.black },
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
    color: colors.black,
    backgroundColor: colors.white,
  },
  priceField: { gap: spacing.sm },
  priceLabel: { fontSize: 14, fontWeight: '600', color: colors.gray600 },
  paymentSummary: { fontSize: 13, color: colors.green, fontWeight: '600' },
  paymentWarning: { fontSize: 13, color: colors.danger, fontWeight: '500' },
  availabilityNote: { fontSize: 13, color: colors.gray500, fontStyle: 'italic', marginTop: spacing.sm },
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
