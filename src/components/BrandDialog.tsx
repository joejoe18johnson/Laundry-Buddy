import { useMemo } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon, type IconName } from './AppIcon'
import { GhostButton, OutlineButton, PrimaryButton } from './ui'
import { useTheme } from '../context/ThemeContext'
import { brand, radius, spacing } from '../theme'
import { toTitleCase } from '../lib/titleCase'

export type BrandDialogAction = {
  label: string
  icon?: IconName
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  onPress: () => void
}

type BrandActionSheetProps = {
  visible: boolean
  title: string
  message?: string
  icon?: IconName
  actions: BrandDialogAction[]
  onClose: () => void
}

type BrandAlertProps = {
  visible: boolean
  title: string
  message?: string
  icon?: IconName
  confirmLabel?: string
  onClose: () => void
}

function DialogIcon({ icon }: { icon?: IconName }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  if (!icon) return null
  return (
    <View style={styles.iconWrap}>
      <AppIcon name={icon} size={26} color={colors.white} />
    </View>
  )
}

function ActionButton({ action }: { action: BrandDialogAction }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (action.variant === 'danger') {
    return (
      <Pressable
        onPress={action.onPress}
        style={({ pressed }) => [styles.dangerBtn, pressed && styles.btnPressed]}
      >
        <View style={styles.btnRow}>
          {action.icon ? <AppIcon name={action.icon} size={18} color={colors.danger} /> : null}
          <Text style={styles.dangerBtnText}>{toTitleCase(action.label)}</Text>
        </View>
      </Pressable>
    )
  }

  if (action.variant === 'ghost') {
    return <GhostButton title={action.label} icon={action.icon} onPress={action.onPress} full />
  }

  if (action.variant === 'outline') {
    return <OutlineButton title={action.label} icon={action.icon} onPress={action.onPress} full />
  }

  return <PrimaryButton title={action.label} icon={action.icon} onPress={action.onPress} full />
}

export function BrandActionSheet({
  visible,
  title,
  message,
  icon,
  actions,
  onClose,
}: BrandActionSheetProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handle} />
            <DialogIcon icon={icon} />
            <Text style={styles.title}>{toTitleCase(title)}</Text>
            {message ? <Text style={styles.message}>{toTitleCase(message)}</Text> : null}
            <View style={styles.actions}>
              {actions.map((action) => (
                <ActionButton key={action.label} action={action} />
              ))}
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export function BrandAlert({
  visible,
  title,
  message,
  icon = 'info',
  confirmLabel = 'OK',
  onClose,
}: BrandAlertProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.centerOverlay}>
        <View style={styles.alertCard}>
          <DialogIcon icon={icon} />
          <Text style={styles.title}>{toTitleCase(title)}</Text>
          {message ? <Text style={styles.message}>{toTitleCase(message)}</Text> : null}
          <PrimaryButton title={confirmLabel} onPress={onClose} full />
        </View>
      </View>
    </Modal>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(36, 44, 52, 0.52)',
      justifyContent: 'flex-end',
    },
    centerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(36, 44, 52, 0.52)',
      justifyContent: 'center',
      paddingHorizontal: spacing.screen,
    },
    sheet: {
      backgroundColor: colors.white,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    alertCard: {
      backgroundColor: colors.white,
      borderRadius: radius.xl,
      padding: spacing.lg,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.gray200,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: brand.ink,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.black,
      textAlign: 'center',
      letterSpacing: -0.3,
      lineHeight: 28,
    },
    message: {
      fontSize: 15,
      color: colors.gray600,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.sm,
    },
    actions: { gap: spacing.sm, marginTop: spacing.sm },
    dangerBtn: {
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: radius.pill,
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      backgroundColor: colors.white,
    },
    dangerBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.danger,
    },
    btnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    btnPressed: { opacity: 0.88 },
  })
}
