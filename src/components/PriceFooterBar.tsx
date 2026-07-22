import { useMemo, type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { spacing } from '../theme'

export type PriceFooterAddon = {
  label: string
  amount: string
}

type PriceFooterBarProps = {
  price: string
  baseLine: string
  addonLines?: PriceFooterAddon[]
  hint?: string
  isFree?: boolean
  action: ReactNode
}

type SimpleBookFooterBarProps = {
  price: string
  unit?: string
  isFree?: boolean
  action: ReactNode
}

/** Host profile — price orb, unit label, and book action only. */
export function SimpleBookFooterBar({
  price,
  unit = 'Per load',
  isFree = false,
  action,
}: SimpleBookFooterBarProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createSimpleStyles(colors), [colors])

  return (
    <View style={styles.footer}>
      <View style={styles.pricing}>
        <View style={[styles.priceOrb, isFree && styles.priceOrbFree]}>
          <Text style={styles.priceOrbText}>{price}</Text>
        </View>
        <Text style={styles.unit} numberOfLines={1}>
          {unit}
        </Text>
      </View>
      <View style={styles.spacer} />
      <View style={styles.action}>{action}</View>
    </View>
  )
}

/** Shared booking footer — price orb, breakdown, and primary action. */
export function PriceFooterBar({
  price,
  baseLine,
  addonLines = [],
  hint,
  isFree = false,
  action,
}: PriceFooterBarProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.footer}>
      <View style={[styles.priceOrb, isFree && styles.priceOrbFree]}>
        <Text style={styles.priceOrbText}>{price}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.baseLine} numberOfLines={2}>
          {baseLine}
        </Text>
        {addonLines.map((line) => (
          <Text key={line.label} style={styles.addonLine} numberOfLines={1}>
            +{line.label}: {line.amount}
          </Text>
        ))}
        {hint ? (
          <Text style={styles.hint} numberOfLines={2}>
            {hint}
          </Text>
        ) : null}
      </View>

      <View style={styles.action}>{action}</View>
    </View>
  )
}

function createSimpleStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    pricing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 0,
    },
    priceOrb: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.black,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    priceOrbFree: {
      backgroundColor: colors.green,
    },
    priceOrbText: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.white,
      letterSpacing: -0.3,
    },
    unit: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.black,
      letterSpacing: -0.2,
    },
    spacer: {
      flex: 1,
      minWidth: spacing.sm,
    },
    action: {
      flexShrink: 1,
      maxWidth: '62%',
      alignItems: 'flex-end',
    },
  })
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    priceOrb: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.black,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    priceOrbFree: {
      backgroundColor: colors.green,
    },
    priceOrbText: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.white,
      letterSpacing: -0.3,
    },
    details: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
      gap: 2,
      paddingVertical: 2,
    },
    baseLine: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.gray600,
      lineHeight: 18,
    },
    addonLine: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.gray500,
      lineHeight: 18,
    },
    hint: {
      fontSize: 11,
      color: colors.danger,
      fontWeight: '600',
      lineHeight: 15,
      marginTop: 2,
    },
    action: {
      flexShrink: 0,
      minWidth: 152,
    },
  })
}

export function priceFooterShellStyle(colors: ReturnType<typeof useTheme>['colors']) {
  return {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 } as const,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  }
}
