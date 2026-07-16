/** Allowed standard dry times for a load. */
export const TURNAROUND_HOUR_OPTIONS = [1, 1.5, 2] as const

export type TurnaroundHoursOption = (typeof TURNAROUND_HOUR_OPTIONS)[number]

export const MAX_TURNAROUND_HOURS: TurnaroundHoursOption = 2

export const DEFAULT_TURNAROUND_HOURS: TurnaroundHoursOption = 2

export function clampTurnaroundHours(value: number): TurnaroundHoursOption {
  if (value <= 1) return 1
  if (value <= 1.25) return 1
  if (value <= 1.75) return 1.5
  return 2
}

export function formatTurnaroundHours(hours: number): string {
  const value = clampTurnaroundHours(hours)
  if (value === 1) return '1 hr'
  if (value === 1.5) return '1 hr 30 min'
  return '2 hr'
}

export function formatTurnaroundHoursLabel(hours: number): string {
  return `~${formatTurnaroundHours(hours)} dry`
}

export const TURNAROUND_FILTER_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any', value: null },
  { label: 'Up to 1 hr', value: 1 },
  { label: 'Up to 1 hr 30 min', value: 1.5 },
  { label: 'Up to 2 hr', value: 2 },
]
