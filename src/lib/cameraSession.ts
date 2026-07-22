/** Blocks Android hardware-back from navigating away during / right after camera flows. */

let sessionDepth = 0
let suppressHardwareBackUntil = 0
let pendingBookingFlowRestore = false

export function beginCameraSession(): void {
  sessionDepth += 1
}

export function endCameraSession(graceMs = 2500): void {
  sessionDepth = Math.max(0, sessionDepth - 1)
  suppressHardwareBackUntil = Math.max(suppressHardwareBackUntil, Date.now() + graceMs)
  pendingBookingFlowRestore = true
}

export function shouldSuppressHardwareBack(): boolean {
  return sessionDepth > 0 || Date.now() < suppressHardwareBackUntil
}

/** True once after camera/gallery closes — use to restore the booking screen. */
export function consumePendingBookingFlowRestore(): boolean {
  if (!pendingBookingFlowRestore) return false
  pendingBookingFlowRestore = false
  return true
}
