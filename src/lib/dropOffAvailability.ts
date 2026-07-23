export const DROP_OFF_HOUR_MIN = 5
export const DROP_OFF_HOUR_MAX = 22

export const ALL_DROP_OFF_HOURS = [
  5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
] as const

export type DropOffHour = (typeof ALL_DROP_OFF_HOURS)[number]

const LEGACY_SLOTS: Record<string, DropOffHour[]> = {
  'before-10': [5, 6, 7, 8, 9, 10],
  '2pm-4pm': [14, 15, 16],
  'after-4': [17, 18, 19, 20, 21, 22],
}

export function isDropOffHour(value: unknown): value is DropOffHour {
  return typeof value === 'number' && Number.isInteger(value) && value >= DROP_OFF_HOUR_MIN && value <= DROP_OFF_HOUR_MAX
}

function migrateLegacySlot(slot: unknown): DropOffHour[] {
  if (isDropOffHour(slot)) return [slot]
  if (typeof slot === 'string' && LEGACY_SLOTS[slot]) return LEGACY_SLOTS[slot]
  return []
}

export function sortDropOffHours(hours: readonly DropOffHour[]): DropOffHour[] {
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

export function formatDropOffHoursWindow(): string {
  const first = ALL_DROP_OFF_HOURS[0]
  const last = ALL_DROP_OFF_HOURS[ALL_DROP_OFF_HOURS.length - 1]
  return `${formatDropOffHour(first)} – ${formatDropOffHour(last)}`
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

/** Current hour mapped into the drop-off grid (5am–10pm). */
export function getCurrentDropOffHour(now = new Date()): DropOffHour {
  const hour = now.getHours()
  if (hour <= DROP_OFF_HOUR_MIN) return DROP_OFF_HOUR_MIN
  if (hour >= DROP_OFF_HOUR_MAX) return DROP_OFF_HOUR_MAX
  return hour as DropOffHour
}

export function isWithinDropOffAvailability(
  hours: readonly DropOffHour[] | undefined,
  now = new Date(),
): boolean {
  const normalized = normalizeDropOffAvailability(hours ? [...hours] : undefined)
  return normalized.includes(getCurrentDropOffHour(now))
}

/** During set drop-off hours hosts stay online automatically; outside hours use manual toggle. */
export function resolveEffectiveHostOnline(
  settings: { isOnline: boolean; dropOffAvailability: DropOffHour[] },
  now = new Date(),
): boolean {
  if (isWithinDropOffAvailability(settings.dropOffAvailability, now)) return true
  return settings.isOnline
}
