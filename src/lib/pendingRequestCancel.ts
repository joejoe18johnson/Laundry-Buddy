import type { Booking } from '../types'

export const PENDING_REQUEST_CANCEL_MS = 30 * 60 * 1000

export function getBookingCreatedAtMs(booking: Booking): number | null {
  if (booking.createdAt) {
    const parsed = Date.parse(booking.createdAt)
    if (Number.isFinite(parsed)) return parsed
  }

  const match = booking.id.match(/^bk-(\d+)$/)
  if (match) {
    const parsed = Number(match[1])
    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

export function getMsUntilGuestCanCancel(booking: Booking, now = Date.now()): number {
  if (booking.requestStatus !== 'pending') return 0
  const createdAt = getBookingCreatedAtMs(booking)
  if (createdAt == null) return 0
  return Math.max(0, PENDING_REQUEST_CANCEL_MS - (now - createdAt))
}

export function canGuestCancelPendingRequest(booking: Booking, now = Date.now()): boolean {
  if (booking.requestStatus !== 'pending') return false
  const createdAt = getBookingCreatedAtMs(booking)
  if (createdAt == null) return false
  return now - createdAt >= PENDING_REQUEST_CANCEL_MS
}

export function formatCancelCountdown(ms: number): string {
  if (ms <= 0) return '0 min'
  const totalMinutes = Math.ceil(ms / 60_000)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`
}
