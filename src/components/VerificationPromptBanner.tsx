import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { useTheme } from '../context/ThemeContext'
import { getIdentityVerification, marketplaceLockMessage } from '../lib/identityVerification'
import { toTitleCase } from '../lib/titleCase'
import { radius, spacing } from '../theme'
import type { AppRole } from '../types'

type VerificationPromptBannerProps = {
  role: AppRole
  status: ReturnType<typeof getIdentityVerification>['status']
  onPress: () => void
  compact?: boolean
}

export function VerificationPromptBanner({
  role,
  status,
  onPress,
  compact = false,
}: VerificationPromptBannerProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const isPending = status === 'pending'
  const message = marketplaceLockMessage(role, status)

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, isPending && styles.cardPending, compact && styles.cardCompact]}
    >
      <View style={styles.iconWrap}>
        <AppIcon name={isPending ? 'clock' : 'shield'} size={18} color={colors.black} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>
          {toTitleCase(
            isPending
              ? 'Verification in progress'
              : role === 'host'
                ? 'Verify to unlock hosting'
                : 'Verify to unlock booking',
          )}
        </Text>
        <Text style={styles.body}>{toTitleCase(message)}</Text>
        {!compact ? (
          <Text style={styles.link}>{toTitleCase(isPending ? 'Open verification center' : 'Complete verification')}</Text>
        ) : null}
      </View>
      <AppIcon name="chevron-right" size={18} color={colors.gray500} />
    </Pressable>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.gray200,
      backgroundColor: colors.gray50,
      marginBottom: spacing.lg,
    },
    cardPending: {
      borderColor: colors.gray200,
      backgroundColor: colors.white,
    },
    cardCompact: {
      marginBottom: spacing.md,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    copy: { flex: 1, gap: 4 },
    title: { fontSize: 15, fontWeight: '700', color: colors.black, lineHeight: 20 },
    body: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
    link: { fontSize: 13, fontWeight: '700', color: colors.black, marginTop: 2 },
  })
}
