import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { HostLoadProgress } from '../../components/HostLoadProgress'
import { LoadListBreakdown } from '../../components/LoadListBreakdown'
import { LoadPhotoCapture } from '../../components/LoadPhotoCapture'
import { useApp } from '../../context/AppContext'
import { splitHostActiveLoads } from '../../lib/hostLoads'
import { toTitleCase } from '../../lib/titleCase'
import { GhostButton, PrimaryButton, Screen, StatusBadge } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import { radius, spacing } from '../../theme'
import type { Booking } from '../../types'

function DryingLoadCard({
  load,
  expanded,
  onToggleExpand,
  onMarkDry,
  onMessageGuest,
  styles,
}: {
  load: Booking
  expanded: boolean
  onToggleExpand: () => void
  onMarkDry: (photoUri?: string) => void
  onMessageGuest: () => void
  styles: ReturnType<typeof createStyles>
}) {
  const [photoUri, setPhotoUri] = useState<string | null>(null)

  useEffect(() => {
    if (!expanded) setPhotoUri(null)
  }, [expanded])

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <AppIcon name="user" size={18} />
        </View>
        <View style={styles.cardHeaderBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{load.customerName}</Text>
            <StatusBadge label="Drying" variant="drying" />
          </View>
          <Text style={styles.cardMeta}>
            {load.loads} load{load.loads === 1 ? '' : 's'} · {load.location}
          </Text>
        </View>
      </View>

      <HostLoadProgress load={load} />

      {load.clothesList && load.clothesList.length > 0 ? (
        <LoadListBreakdown items={load.clothesList} title="In the dryer" />
      ) : null}

      {expanded ? (
        <View style={styles.markDryBlock}>
          <View style={styles.markDryHeader}>
            <AppIcon name="check-circle" size={18} />
            <Text style={styles.markDryTitle}>{toTitleCase("Confirm it's dry")}</Text>
          </View>
          <Text style={styles.markDrySub}>
            {toTitleCase('Mark dry when the cycle finishes — add a photo if you can so the guest knows it is ready.')}
          </Text>
          <LoadPhotoCapture photoUri={photoUri} onPhotoChange={setPhotoUri} />
          <PrimaryButton
            title="Mark as dry"
            icon="wind"
            full
            onPress={() => onMarkDry(photoUri ?? undefined)}
          />
          <Text style={styles.markDryHint}>
            {toTitleCase('Guest gets notified: your load is dry and ready for pickup.')}
          </Text>
        </View>
      ) : (
        <PrimaryButton title="Confirm it's dry" icon="check-circle" full onPress={onToggleExpand} />
      )}

      <GhostButton title="Message guest" icon="message-circle" full onPress={onMessageGuest} />
    </View>
  )
}

function ReadyLoadCard({
  load,
  onConfirmPickup,
  onMessageGuest,
  styles,
}: {
  load: Booking
  onConfirmPickup: () => void
  onMessageGuest: () => void
  styles: ReturnType<typeof createStyles>
}) {
  return (
    <View style={[styles.card, styles.readyCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <AppIcon name="user" size={18} />
        </View>
        <View style={styles.cardHeaderBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{load.customerName}</Text>
            <StatusBadge label="Ready" variant="ready" />
          </View>
          <Text style={styles.cardMeta}>
            {load.loads} load{load.loads === 1 ? '' : 's'} · waiting for pickup
          </Text>
        </View>
      </View>

      {load.dryPhotoUri ? (
        <View style={styles.readyPhotoHint}>
          <AppIcon name="camera" size={14} />
          <Text style={styles.readyPhotoHintText}>{toTitleCase('Dry photo sent to guest')}</Text>
        </View>
      ) : null}

      <Text style={styles.pickupHint}>
        {toTitleCase('Confirm once the guest has collected their laundry.')}
      </Text>
      <PrimaryButton title="Guest picked up" icon="check-circle" full onPress={onConfirmPickup} />
      <GhostButton title="Message guest" icon="message-circle" full onPress={onMessageGuest} />
    </View>
  )
}

export function HostDryerScreen() {
  const { activeLoads, markDry, markDryLoadId, confirmPickup, openChat, navigate, clearMarkDryFocus } = useApp()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [expandedLoadId, setExpandedLoadId] = useState<string | null>(null)

  const { dryingLoads, readyLoads, dryerLoads } = useMemo(
    () => splitHostActiveLoads(activeLoads),
    [activeLoads],
  )

  useEffect(() => {
    if (!markDryLoadId) return
    setExpandedLoadId(markDryLoadId)
    clearMarkDryFocus()
  }, [clearMarkDryFocus, markDryLoadId])

  const summary =
    dryingLoads.length > 0 && readyLoads.length > 0
      ? `${dryingLoads.length} drying · ${readyLoads.length} ready`
      : dryingLoads.length > 0
        ? `${dryingLoads.length} in the dryer`
        : `${readyLoads.length} ready for pickup`

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppIcon name="wind" size={22} />
          <Text style={styles.title}>{toTitleCase('Dryer')}</Text>
        </View>
        {dryerLoads.length > 0 ? <Text style={styles.summary}>{summary}</Text> : null}
      </View>

      {dryerLoads.length === 0 ? (
        <View style={styles.empty}>
          <AppIcon name="wind" size={36} color={colors.gray400} />
          <Text style={styles.emptyTitle}>{toTitleCase('Dryer is empty')}</Text>
          <Text style={styles.emptySub}>
            {toTitleCase('Loads appear here after you start drying. Manage new requests on the dashboard.')}
          </Text>
          <PrimaryButton title="Go to dashboard" icon="home" onPress={() => navigate('host-dashboard')} />
        </View>
      ) : (
        <>
          {dryingLoads.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppIcon name="wind" size={14} />
                <Text style={styles.sectionTitle}>
                  {toTitleCase(`In the dryer (${dryingLoads.length})`)}
                </Text>
              </View>
              {dryingLoads.map((load) => (
                <DryingLoadCard
                  key={load.id}
                  load={load}
                  expanded={expandedLoadId === load.id}
                  onToggleExpand={() =>
                    setExpandedLoadId((current) => (current === load.id ? null : load.id))
                  }
                  onMarkDry={(photoUri) => {
                    markDry(load.id, photoUri)
                    setExpandedLoadId(null)
                  }}
                  onMessageGuest={() => openChat(load.id, load.id)}
                  styles={styles}
                />
              ))}
            </View>
          ) : null}

          {readyLoads.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppIcon name="package" size={14} />
                <Text style={styles.sectionTitle}>
                  {toTitleCase(`Ready for pickup (${readyLoads.length})`)}
                </Text>
              </View>
              {readyLoads.map((load) => (
                <ReadyLoadCard
                  key={load.id}
                  load={load}
                  onConfirmPickup={() => confirmPickup(load.id)}
                  onMessageGuest={() => openChat(load.id, load.id)}
                  styles={styles}
                />
              ))}
            </View>
          ) : null}
        </>
      )}

      {dryerLoads.length > 0 ? (
        <Pressable style={styles.dashboardLink} onPress={() => navigate('host-dashboard')}>
          <Text style={styles.dashboardLinkText}>{toTitleCase('New requests & payments → Dashboard')}</Text>
          <AppIcon name="chevron-right" size={16} color={colors.gray500} />
        </Pressable>
      ) : null}
    </Screen>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    header: { marginBottom: spacing.lg, gap: spacing.sm },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    title: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
    summary: { fontSize: 14, color: colors.gray500, fontWeight: '600' },
    section: { marginBottom: spacing.xl, gap: spacing.md },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    sectionTitle: { fontSize: 15, fontWeight: '700' },
    card: {
      borderWidth: 1,
      borderColor: colors.black,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.md,
      backgroundColor: colors.white,
    },
    readyCard: { borderColor: colors.green, backgroundColor: colors.greenBg },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    cardHeaderBody: { flex: 1, minWidth: 0, gap: 4 },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    cardTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
    cardMeta: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.gray100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    markDryBlock: {
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.gray50,
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    markDryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    markDryTitle: { fontSize: 18, fontWeight: '700' },
    markDrySub: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
    markDryHint: { fontSize: 12, color: colors.gray500, lineHeight: 18, textAlign: 'center' },
    pickupHint: { fontSize: 14, color: colors.gray600, lineHeight: 20 },
    readyPhotoHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    readyPhotoHintText: { fontSize: 13, color: colors.gray600, fontWeight: '600' },
    empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
    emptyTitle: { fontSize: 18, fontWeight: '700' },
    emptySub: { fontSize: 14, color: colors.gray500, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
    dashboardLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: spacing.md,
    },
    dashboardLinkText: { fontSize: 14, fontWeight: '600', color: colors.gray500 },
  })
}
