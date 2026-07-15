import { StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { hasDelicates, totalClothesCount } from '../lib/clothesList'
import type { ClothesListItem } from '../types'
import { colors, radius, spacing } from '../theme'

type Props = {
  items: ClothesListItem[]
  compact?: boolean
}

export function ClothesListDisplay({ items, compact }: Props) {
  if (items.length === 0) return null

  const total = totalClothesCount(items)
  const delicates = hasDelicates(items)

  if (compact) {
    return (
      <View style={styles.compactWrap}>
        {items.map((item) => (
          <View key={item.id} style={styles.chip}>
            <Text style={styles.chipText}>
              {item.label}
              {item.quantity > 1 ? ` ×${item.quantity}` : ''}
            </Text>
          </View>
        ))}
        {delicates ? (
          <View style={[styles.chip, styles.delicateChip]}>
            <Text style={styles.delicateChipText}>Delicates</Text>
          </View>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <AppIcon name="list" size={14} color={colors.gray600} />
        <Text style={styles.label}>Clothes list</Text>
        <Text style={styles.count}>
          {total} item{total === 1 ? '' : 's'}
        </Text>
      </View>
      <View style={styles.items}>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Text style={styles.itemQty}>×{item.quantity}</Text>
          </View>
        ))}
      </View>
      {delicates ? (
        <View style={styles.delicateBanner}>
          <AppIcon name="alert-circle" size={14} color={colors.gray600} />
          <Text style={styles.delicateText}>Includes delicates — handle with care</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  label: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.gray600, textTransform: 'uppercase', letterSpacing: 0.4 },
  count: { fontSize: 12, fontWeight: '600', color: colors.gray500 },
  items: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.black },
  itemQty: { fontSize: 14, fontWeight: '700', color: colors.gray600 },
  delicateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  delicateText: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.gray600 },
  compactWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: colors.gray100,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.gray600 },
  delicateChip: { backgroundColor: colors.black },
  delicateChipText: { fontSize: 12, fontWeight: '700', color: colors.white },
})
