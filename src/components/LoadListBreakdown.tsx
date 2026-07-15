import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { ClothesListDisplay } from './ClothesListDisplay'
import { totalClothesCount } from '../lib/clothesList'
import type { ClothesListItem } from '../types'
import { colors, radius, spacing } from '../theme'

type Props = {
  items: ClothesListItem[]
  title?: string
  /** Show the full item-by-item breakdown expanded on first render. */
  defaultExpanded?: boolean
}

export function LoadListBreakdown({
  items,
  title = 'Load list',
  defaultExpanded = true,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  if (items.length === 0) return null

  const total = totalClothesCount(items)
  const uniqueTypes = items.length

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.header}
        onPress={() => setExpanded((open) => !open)}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Hide load list breakdown' : 'Show load list breakdown'}
      >
        <View style={styles.headerLeft}>
          <AppIcon name="list" size={16} color={colors.black} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.count}>
            {uniqueTypes} type{uniqueTypes === 1 ? '' : 's'} · {total} item{total === 1 ? '' : 's'}
          </Text>
          <AppIcon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.gray500} />
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          <ClothesListDisplay items={items} embedded />
        </View>
      ) : (
        <View style={styles.previewBody}>
          <ClothesListDisplay items={items} compact />
          <Text style={styles.previewHint}>Tap to see full breakdown with quantities</Text>
        </View>
      )}
    </View>
  )
}

/** @deprecated Use LoadListBreakdown */
export const HostLoadListPreview = LoadListBreakdown

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 14, fontWeight: '700', color: colors.black },
  count: { fontSize: 12, fontWeight: '600', color: colors.gray500 },
  body: { padding: spacing.sm },
  previewBody: { padding: spacing.md, gap: spacing.sm },
  previewHint: { fontSize: 12, color: colors.gray500, fontStyle: 'italic' },
})
