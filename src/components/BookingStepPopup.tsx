import { useMemo } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import { PrimaryButton } from './ui'
import { toTitleCase } from '../lib/titleCase'
import type { BookingStepEvent } from '../lib/bookingStepEvents'
import { useTheme } from '../context/ThemeContext'
import { radius, spacing } from '../theme'

type Props = {
  visible: boolean
  event: BookingStepEvent | null
  queueCount?: number
  onPrimary: () => void
  onDismiss: () => void
}

export function BookingStepPopup({
  visible,
  event,
  queueCount = 0,
  onPrimary,
  onDismiss,
}: Props) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (!event) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View
        style={[
          styles.overlay,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <View style={styles.card}>
          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <AppIcon name={event.icon} size={28} color={colors.white} />
            </View>
            <Text style={styles.kicker}>{toTitleCase(event.kicker)}</Text>
            <Text style={styles.title}>{event.title}</Text>
            {queueCount > 1 ? (
              <Text style={styles.queueHint}>
                {toTitleCase(`${queueCount} updates waiting · one at a time`)}
              </Text>
            ) : null}
          </View>

          <View style={styles.body}>
            <Text style={styles.bodyText}>{event.body}</Text>
          </View>

          <View style={styles.actions}>
            <PrimaryButton title={event.primaryLabel} icon={event.icon} full onPress={onPrimary} />
            <Pressable onPress={onDismiss} hitSlop={8} style={styles.laterBtn}>
              <Text style={styles.laterText}>{toTitleCase('Dismiss')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      paddingHorizontal: spacing.screen,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    hero: {
      backgroundColor: colors.black,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    kicker: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.72)',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.white,
      letterSpacing: -0.5,
      textAlign: 'center',
      lineHeight: 30,
    },
    queueHint: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.78)',
      textAlign: 'center',
      lineHeight: 18,
    },
    body: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
    },
    bodyText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.gray600,
      textAlign: 'center',
    },
    actions: { padding: spacing.lg, paddingTop: 0, gap: spacing.sm },
    laterBtn: { alignItems: 'center', paddingVertical: spacing.sm },
    laterText: { fontSize: 14, fontWeight: '600', color: colors.gray500 },
  })
}
