import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppIcon } from '../AppIcon'
import { PrimaryButton } from '../ui'
import { useTheme } from '../../context/ThemeContext'
import { formatHostPrice } from '../../lib/hostFilters'
import {
  buildHostPricingHints,
  computeMarketPricingSnapshot,
  DRYER_SHEETS_GUEST_HINT,
  parsePriceInput,
} from '../../lib/hostPricing'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'
import type { HostPricing } from '../../types'

export type HostPricingSectionProps = {
  pricing: HostPricing
  onPricingChange: (partial: Partial<HostPricing>) => void
  variant?: 'card' | 'plain'
  showSaveButton?: boolean
  onSave?: () => void
  saved?: boolean
  onEditInSettings?: () => void
  hostId?: string
  rating?: number
  reviewCount?: number
}

export function HostPricingSection({
  pricing,
  onPricingChange,
  variant = 'plain',
  showSaveButton = false,
  onSave,
  saved = true,
  onEditInSettings,
  hostId,
  rating,
  reviewCount,
}: HostPricingSectionProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const isCard = variant === 'card'
  const market = useMemo(() => computeMarketPricingSnapshot(hostId), [hostId])
  const pricingHints = useMemo(() => {
    if (!market) return []
    return buildHostPricingHints(
      pricing,
      market,
      rating != null && reviewCount != null ? { rating, reviewCount } : undefined,
    )
  }, [market, pricing, rating, reviewCount])

  const content = (
    <>
      <Text style={styles.sectionHint}>
        {toTitleCase(
          'You control what you charge. Guests see these rates on the map, your profile, and when booking. Set folding to $0 to hide that service.',
        )}
      </Text>
      {market ? (
        <View style={styles.marketCard}>
          <View style={styles.marketHeader}>
            <AppIcon name="trending-up" size={14} color={colors.gray600} />
            <Text style={styles.marketTitle}>{toTitleCase('Local market')}</Text>
          </View>
          <Text style={styles.marketAverage}>
            {toTitleCase('Average dry price')}: {formatHostPrice(market.avgDryPrice)}
            {market.avgFoldingPrice != null
              ? ` · ${toTitleCase('Folding')} ${formatHostPrice(market.avgFoldingPrice)}`
              : ''}
          </Text>
          {pricingHints.map((hint) => (
            <Text key={hint} style={styles.marketHint}>
              {toTitleCase(hint)}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.priceField}>
        <Text style={styles.priceLabel}>{toTitleCase('Drying (per load)')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={String(pricing.dryPrice)}
          onChangeText={(v) => onPricingChange({ dryPrice: parsePriceInput(v) })}
        />
      </View>
      <View style={styles.priceField}>
        <Text style={styles.priceLabel}>{toTitleCase('Folding service (per load)')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={String(pricing.foldingPrice)}
          onChangeText={(v) => onPricingChange({ foldingPrice: parsePriceInput(v) })}
        />
      </View>
      <Text style={styles.guestSummary}>
        {toTitleCase('Guests see')}: Dry {formatHostPrice(pricing.dryPrice)}
        {pricing.foldingPrice > 0 ? ` · Folding ${formatHostPrice(pricing.foldingPrice)}` : ''}
      </Text>
      <Text style={styles.sheetsNote}>{toTitleCase(DRYER_SHEETS_GUEST_HINT)}</Text>
      {showSaveButton && onSave ? (
        <PrimaryButton
          title={saved ? toTitleCase('Prices saved') : toTitleCase('Save prices')}
          onPress={onSave}
          full
          disabled={saved}
        />
      ) : null}
    </>
  )

  if (isCard) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AppIcon name="dollar-sign" size={14} color={colors.gray600} />
          <Text style={styles.cardTitle}>{toTitleCase('Your prices')}</Text>
        </View>
        {content}
        {onEditInSettings ? (
          <Pressable style={styles.editLink} onPress={onEditInSettings}>
            <Text style={styles.editLinkText}>{toTitleCase('More host settings')}</Text>
            <AppIcon name="chevron-right" size={14} color={colors.gray500} />
          </Pressable>
        ) : null}
      </View>
    )
  }

  return <View style={styles.plain}>{content}</View>
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.gray50,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.gray100,
      gap: spacing.sm,
    },
    plain: { gap: spacing.sm },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
    cardTitle: { fontSize: 12, fontWeight: '700', color: colors.gray600 },
    sectionHint: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
    marketCard: {
      backgroundColor: colors.white,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.gray100,
      padding: spacing.sm,
      gap: 6,
    },
    marketHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    marketTitle: { fontSize: 12, fontWeight: '700', color: colors.gray600 },
    marketAverage: { fontSize: 13, fontWeight: '600', color: colors.black, lineHeight: 18 },
    marketHint: { fontSize: 12, color: colors.gray500, lineHeight: 17 },
    priceField: { gap: spacing.sm },
    priceLabel: { fontSize: 14, fontWeight: '600', color: colors.gray600 },
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
    guestSummary: { fontSize: 13, color: colors.gray600, fontWeight: '600', lineHeight: 18 },
    sheetsNote: { fontSize: 12, color: colors.gray500, lineHeight: 17 },
    editLink: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 2,
      marginTop: spacing.sm,
    },
    editLinkText: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  })
}
