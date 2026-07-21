import { useEffect, useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { HostLoadProgress } from '../../components/HostLoadProgress'
import { LoadListBreakdown } from '../../components/LoadListBreakdown'
import { LoadPhotoCapture } from '../../components/LoadPhotoCapture'
import { HostPreDryerLoadCard } from '../../components/host/HostPreDryerLoadCard'
import { useApp } from '../../context/AppContext'
import { splitHostActiveLoads } from '../../lib/hostLoads'
import {
  canHostConfirmPickup,
  isAwaitingGuestPickupConfirmation,
  isAwaitingHostPickupConfirmation,
} from '../../lib/pickupConfirmation'
import { toTitleCase } from '../../lib/titleCase'
import { GhostButton, PrimaryButton, Screen, StatusBadge } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import { radius, spacing } from '../../theme'
import type { Booking } from '../../types'

function DryingLoadCard({
  load,
  expanded,
  photoUri,
  onPhotoChange,
  onToggleExpand,
  onMarkDry,
  onMessageGuest,
  styles,
}: {
  load: Booking
  expanded: boolean
  photoUri: string | null
  onPhotoChange: (uri: string | null) => void
  onToggleExpand: () => void
  onMarkDry: (photoUri?: string) => void
  onMessageGuest: () => void
  styles: ReturnType<typeof createStyles>
}) {
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
          <LoadPhotoCapture photoUri={photoUri} onPhotoChange={onPhotoChange} />
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
  colors,
}: {
  load: Booking
  onConfirmPickup: () => void
  onMessageGuest: () => void
  styles: ReturnType<typeof createStyles>
  colors: ReturnType<typeof useTheme>['colors']
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
        {isAwaitingGuestPickupConfirmation(load)
          ? toTitleCase('You confirmed pickup — waiting for the guest to confirm on their phone.')
          : isAwaitingHostPickupConfirmation(load)
            ? toTitleCase('Guest confirmed pickup — confirm below once they have collected their laundry.')
            : toTitleCase('Confirm once the guest has collected their laundry. Both of you must confirm pickup.')}
      </Text>
      {canHostConfirmPickup(load) ? (
        <PrimaryButton title="Guest picked up" icon="check-circle" full onPress={onConfirmPickup} />
      ) : isAwaitingHostPickupConfirmation(load) ? (
        <PrimaryButton title="Confirm guest picked up" icon="check-circle" full onPress={onConfirmPickup} />
      ) : (
        <View style={styles.waitingPickupBadge}>
          <AppIcon name="clock" size={14} color={colors.gray600} />
          <Text style={styles.waitingPickupText}>{toTitleCase('Waiting for guest confirmation')}</Text>
        </View>
      )}
      <GhostButton title="Message guest" icon="message-circle" full onPress={onMessageGuest} />
    </View>
  )
}

export function HostDryerScreen() {
  const {
    activeLoads,
    markDry,
    markDryExpandedLoadId,
    setMarkDryExpandedLoadId,
    markDryPhotoDrafts,
    setMarkDryPhotoDraft,
    confirmPickup,
    confirmTransferPayment,
    advanceStage,
    openChat,
    navigate,
    registerHardwareBackHandler,
  } = useApp()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const { preDryerLoads, dryingLoads, readyLoads, dryerLoads } = useMemo(
    () => splitHostActiveLoads(activeLoads),
    [activeLoads],
  )

  useEffect(() => {
    if (!markDryExpandedLoadId) {
      registerHardwareBackHandler(null)
      return
    }

    registerHardwareBackHandler(() => {
      setMarkDryExpandedLoadId(null)
      return true
    })

    return () => registerHardwareBackHandler(null)
  }, [markDryExpandedLoadId, registerHardwareBackHandler, setMarkDryExpandedLoadId])

  const summary =
    preDryerLoads.length > 0 && dryingLoads.length === 0 && readyLoads.length === 0
      ? `${preDryerLoads.length} awaiting drop-off or payment`
      : dryingLoads.length > 0 && readyLoads.length > 0
        ? `${dryingLoads.length} drying · ${readyLoads.length} ready`
        : dryingLoads.length > 0
          ? `${dryingLoads.length} in the dryer`
          : readyLoads.length > 0
            ? `${readyLoads.length} ready for pickup`
            : `${preDryerLoads.length} active load${preDryerLoads.length === 1 ? '' : 's'}`

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
            {toTitleCase('Accepted loads appear here for payment, drying, and pickup. New requests stay on the dashboard.')}
          </Text>
          <PrimaryButton title="Go to dashboard" icon="home" onPress={() => navigate('host-dashboard')} />
        </View>
      ) : (
        <>
          {preDryerLoads.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppIcon name="package" size={14} />
                <Text style={styles.sectionTitle}>
                  {toTitleCase(`Drop-off & payment (${preDryerLoads.length})`)}
                </Text>
              </View>
              {preDryerLoads.map((load) => (
                <HostPreDryerLoadCard
                  key={load.id}
                  load={load}
                  onConfirmPayment={confirmTransferPayment}
                  onStartDrying={(loadId) => {
                    advanceStage(loadId, 'drying')
                    setMarkDryExpandedLoadId(loadId)
                  }}
                  onMessageGuest={(loadId) => openChat(loadId, loadId)}
                />
              ))}
            </View>
          ) : null}

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
                  expanded={markDryExpandedLoadId === load.id}
                  photoUri={markDryPhotoDrafts[load.id] ?? null}
                  onPhotoChange={(uri) => setMarkDryPhotoDraft(load.id, uri)}
                  onToggleExpand={() =>
                    setMarkDryExpandedLoadId(markDryExpandedLoadId === load.id ? null : load.id)
                  }
                  onMarkDry={(photoUri) => {
                    markDry(load.id, photoUri)
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
                  colors={colors}
                />
              ))}
            </View>
          ) : null}
        </>
      )}

      {dryerLoads.length > 0 ? (
        <Pressable style={styles.dashboardLink} onPress={() => navigate('host-dashboard')}>
          <Text style={styles.dashboardLinkText}>{toTitleCase('New booking requests → Dashboard')}</Text>
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
    waitingPickupBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.gray50,
      borderWidth: 1,
      borderColor: colors.gray200,
    },
    waitingPickupText: { fontSize: 14, fontWeight: '600', color: colors.gray600 },
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
