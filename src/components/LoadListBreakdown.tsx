import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { toTitleCase } from '../lib/titleCase'
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
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <AppIcon name="list" size={16} color={colors.black} />
            <Text style={styles.title} numberOfLines={2}>
              {toTitleCase(title)}
            </Text>
          </View>
          <AppIcon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.gray500} />
        </View>
        <Text style={styles.count}>
          {uniqueTypes} type{uniqueTypes === 1 ? '' : 's'} · {total} item{total === 1 ? '' : 's'}
        </Text>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          <ClothesListDisplay items={items} embedded />
        </View>
      ) : (
        <View style={styles.previewBody}>
          <ClothesListDisplay items={items} compact />
          <Text style={styles.previewHint}>{toTitleCase('Tap to see full breakdown with quantities')}</Text>
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
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.black, lineHeight: 19 },
  count: { fontSize: 12, fontWeight: '600', color: colors.gray500, lineHeight: 17 },
  body: { padding: spacing.sm },
  previewBody: { padding: spacing.md, gap: spacing.sm },
  previewHint: { fontSize: 12, color: colors.gray500, fontStyle: 'italic' },
})
