import type { ClothesListItem } from '../types'

export type { ClothesListItem }

export const CLOTHES_PRESETS = [
  'T-shirts',
  'Jeans',
  'Shorts',
  'Dress / skirt',
  'Socks',
  'Underwear',
  'Towels',
  'Bed sheets',
  'Hoodie',
  'Work uniform',
  'Gym clothes',
  'Delicates',
] as const

export function createClothesItem(label: string, quantity = 1): ClothesListItem {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return {
    id: `${slug}-${Date.now().toString(36)}`,
    label: label.trim(),
    quantity: Math.max(1, quantity),
  }
}

export function addOrIncrementItem(items: ClothesListItem[], label: string): ClothesListItem[] {
  const normalized = label.trim()
  if (!normalized) return items

  const existing = items.find((item) => item.label.toLowerCase() === normalized.toLowerCase())
  if (existing) {
    return items.map((item) =>
      item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item,
    )
  }

  return [...items, createClothesItem(normalized)]
}

export function updateItemQuantity(
  items: ClothesListItem[],
  id: string,
  delta: number,
): ClothesListItem[] {
  return items
    .map((item) => {
      if (item.id !== id) return item
      return { ...item, quantity: item.quantity + delta }
    })
    .filter((item) => item.quantity > 0)
}

export function removeClothesItem(items: ClothesListItem[], id: string): ClothesListItem[] {
  return items.filter((item) => item.id !== id)
}

export function formatClothesListSummary(items: ClothesListItem[]): string {
  if (items.length === 0) return ''
  return items
    .map((item) => (item.quantity > 1 ? `${item.label} ×${item.quantity}` : item.label))
    .join(', ')
}

export function totalClothesCount(items: ClothesListItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function hasDelicates(items: ClothesListItem[]): boolean {
  return items.some((item) => item.label.toLowerCase().includes('delicate'))
}
