export const DROP_OFF_HOUR_MIN = 8
export const DROP_OFF_HOUR_MAX = 20

export type DropOffHour =
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20

export const ALL_DROP_OFF_HOURS: DropOffHour[] = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
]

const LEGACY_SLOTS: Record<string, DropOffHour[]> = {
  'before-10': [8, 9, 10],
  '2pm-4pm': [14, 15, 16],
  'after-4': [17, 18, 19, 20],
}

export function isDropOffHour(value: unknown): value is DropOffHour {
  return typeof value === 'number' && Number.isInteger(value) && value >= 8 && value <= 20
}

function migrateLegacySlot(slot: unknown): DropOffHour[] {
  if (isDropOffHour(slot)) return [slot]
  if (typeof slot === 'string' && LEGACY_SLOTS[slot]) return LEGACY_SLOTS[slot]
  return []
}

export function sortDropOffHours(hours: DropOffHour[]): DropOffHour[] {
  return [...hours].filter(isDropOffHour).sort((a, b) => a - b)
}

export function normalizeDropOffAvailability(slots?: unknown[] | null): DropOffHour[] {
  if (!slots?.length) return [...ALL_DROP_OFF_HOURS]
  const migrated = slots.flatMap(migrateLegacySlot)
  const unique = [...new Set(migrated.filter(isDropOffHour))]
  const sorted = sortDropOffHours(unique)
  return sorted.length > 0 ? sorted : [...ALL_DROP_OFF_HOURS]
}

export function formatDropOffHour(hour: DropOffHour): string {
  if (hour === 12) return '12pm'
  if (hour < 12) return `${hour}am`
  return `${hour - 12}pm`
}

export function formatDropOffAvailability(hours: DropOffHour[]): string {
  const sorted = sortDropOffHours(hours)
  if (!sorted.length) return 'None set'

  const ranges: { start: DropOffHour; end: DropOffHour }[] = []
  let start = sorted[0]
  let end = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i]
    } else {
      ranges.push({ start, end })
      start = sorted[i]
      end = sorted[i]
    }
  }
  ranges.push({ start, end })

  return ranges
    .map(({ start, end }) =>
      start === end
        ? formatDropOffHour(start)
        : `${formatDropOffHour(start)}–${formatDropOffHour(end)}`,
    )
    .join(' · ')
}

export function toggleDropOffHour(current: DropOffHour[], hour: DropOffHour): DropOffHour[] {
  if (current.includes(hour)) {
    const next = current.filter((h) => h !== hour)
    return next.length > 0 ? sortDropOffHours(next) : current
  }
  return sortDropOffHours([...current, hour])
}
