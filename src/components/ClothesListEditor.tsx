import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { ChoiceChip } from './ui'
import {
  CLOTHES_PRESETS,
  addOrIncrementItem,
  removeClothesItem,
  totalClothesCount,
  updateItemQuantity,
} from '../lib/clothesList'
import type { ClothesListItem } from '../types'
import { colors, radius, spacing } from '../theme'

type Props = {
  items: ClothesListItem[]
  onChange: (items: ClothesListItem[]) => void
}

export function ClothesListEditor({ items, onChange }: Props) {
  const [customLabel, setCustomLabel] = useState('')

  const addCustom = () => {
    const trimmed = customLabel.trim()
    if (!trimmed) return
    onChange(addOrIncrementItem(items, trimmed))
    setCustomLabel('')
  }

  const total = totalClothesCount(items)

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>Tap common items to add them. Adjust quantities below.</Text>

      <View style={styles.chips}>
        {CLOTHES_PRESETS.map((label) => {
          const selected = items.some((item) => item.label.toLowerCase() === label.toLowerCase())
          return (
            <ChoiceChip
              key={label}
              label={label}
              size="compact"
              selected={selected}
              onPress={() => onChange(addOrIncrementItem(items, label))}
            />
          )
        })}
      </View>

      <View style={styles.customRow}>
        <TextInput
          style={styles.customInput}
          value={customLabel}
          onChangeText={setCustomLabel}
          placeholder="Add something else…"
          placeholderTextColor={colors.gray400}
          returnKeyType="done"
          onSubmitEditing={addCustom}
        />
        <Pressable
          style={[styles.addBtn, !customLabel.trim() && styles.addBtnDisabled]}
          onPress={addCustom}
          disabled={!customLabel.trim()}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {items.length > 0 ? (
        <View style={styles.list}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Your list</Text>
            <Text style={styles.listCount}>{total} item{total === 1 ? '' : 's'}</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <View style={styles.qtyControls}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => onChange(updateItemQuantity(items, item.id, -1))}
                  hitSlop={6}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => onChange(updateItemQuantity(items, item.id, 1))}
                  hitSlop={6}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => onChange(removeClothesItem(items, item.id))}
                hitSlop={8}
                style={styles.removeBtn}
              >
                <AppIcon name="x" size={16} color={colors.gray500} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <AppIcon name="list" size={20} color={colors.gray400} />
          <Text style={styles.emptyText}>No items yet — tap a chip above to start</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  hint: { fontSize: 13, color: colors.gray500, lineHeight: 18, marginTop: -spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  customRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.black,
  },
  addBtn: {
    backgroundColor: colors.black,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minWidth: 64,
    alignItems: 'center',
  },
  addBtnDisabled: { backgroundColor: colors.gray200 },
  addBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  list: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  listTitle: { fontSize: 12, fontWeight: '700', color: colors.gray600, textTransform: 'capitalize', letterSpacing: 0.4 },
  listCount: { fontSize: 12, fontWeight: '600', color: colors.gray500 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.black },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gray50,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '600', color: colors.black, lineHeight: 20 },
  qtyValue: { minWidth: 20, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  removeBtn: { padding: 4 },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    backgroundColor: colors.gray50,
  },
  emptyText: { fontSize: 13, color: colors.gray500, textAlign: 'center', paddingHorizontal: spacing.md },
})
