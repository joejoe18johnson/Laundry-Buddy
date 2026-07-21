/** Blocks Android hardware-back from navigating away during / right after camera flows. */

let sessionDepth = 0
let suppressHardwareBackUntil = 0

export function beginCameraSession(): void {
  sessionDepth += 1
}

export function endCameraSession(graceMs = 900): void {
  sessionDepth = Math.max(0, sessionDepth - 1)
  suppressHardwareBackUntil = Math.max(suppressHardwareBackUntil, Date.now() + graceMs)
}

export function shouldSuppressHardwareBack(): boolean {
  return sessionDepth > 0 || Date.now() < suppressHardwareBackUntil
}
