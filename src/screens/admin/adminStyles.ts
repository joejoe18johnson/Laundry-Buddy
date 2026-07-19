import { StyleSheet } from 'react-native'
import type { useTheme } from '../../context/ThemeContext'
import { radius, spacing } from '../../theme'
import type { User } from '../../types'
import { verificationStatusLabel } from '../../lib/identityVerification'

export function createAdminStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    subtitle: { fontSize: 14, color: colors.gray500, lineHeight: 20, marginBottom: spacing.lg },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    statCard: {
      flexGrow: 1,
      minWidth: '45%',
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: colors.white,
    },
    statValue: { fontSize: 22, fontWeight: '700', color: colors.black },
    statLabel: { fontSize: 12, color: colors.gray500, marginTop: 4 },
    section: { marginBottom: spacing.xl },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.gray600,
      letterSpacing: 0.4,
      marginBottom: spacing.sm,
    },
    card: {
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: colors.white,
      gap: spacing.sm,
    },
    cardHighlighted: { borderColor: colors.black, backgroundColor: colors.gray50 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
    cardName: { fontSize: 16, fontWeight: '600', color: colors.black },
    cardMeta: { fontSize: 12, color: colors.gray500, lineHeight: 18 },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.gray100,
    },
    badgePending: { backgroundColor: colors.gray75 },
    badgeVerified: { backgroundColor: colors.greenBg },
    badgeText: { fontSize: 11, fontWeight: '700', color: colors.gray600 },
    queueType: { fontSize: 11, fontWeight: '700', color: colors.gray600, letterSpacing: 0.3 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray100,
    },
    codeValue: {
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 2,
      color: colors.black,
      fontVariant: ['tabular-nums'],
    },
    codeMeta: { fontSize: 12, color: colors.gray500, textAlign: 'right', flex: 1, marginLeft: spacing.md },
    hint: {
      fontSize: 12,
      color: colors.gray500,
      lineHeight: 18,
      marginTop: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.gray50,
      borderRadius: radius.md,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.gray50,
      borderWidth: 1,
      borderColor: colors.danger,
      marginBottom: spacing.md,
    },
    bannerText: { flex: 1, fontSize: 13, color: colors.danger, lineHeight: 18 },
    navGrid: { gap: spacing.sm, marginBottom: spacing.lg },
    navCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.lg,
      backgroundColor: colors.white,
    },
    navCardPressed: { borderColor: colors.black, backgroundColor: colors.gray50 },
    navIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.gray50,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    navCopy: { flex: 1, gap: 4 },
    navTitle: { fontSize: 16, fontWeight: '700', color: colors.black },
    navSub: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
  })
}

export function statusBadgeStyle(
  status: string,
  styles: ReturnType<typeof createAdminStyles>,
) {
  if (status === 'verified') return [styles.badge, styles.badgeVerified]
  if (status === 'pending') return [styles.badge, styles.badgePending]
  return styles.badge
}

export function formatAdminLogin(user: User): string {
  if (user.email) return user.email
  if (user.phone) return user.phone.replace(/^501/, '')
  return user.id
}

export { verificationStatusLabel }
