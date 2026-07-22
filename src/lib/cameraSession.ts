import type { Screen } from '../types'

/** Blocks Android hardware-back from navigating away during / right after camera flows. */

let sessionDepth = 0
let suppressHardwareBackUntil = 0
let pendingFlowRestore = false
let returnScreen: Screen | null = null

export function beginCameraSession(restoreTo?: Screen): void {
  sessionDepth += 1
  if (restoreTo) returnScreen = restoreTo
}

export function endCameraSession(graceMs = 2500): void {
  sessionDepth = Math.max(0, sessionDepth - 1)
  suppressHardwareBackUntil = Math.max(suppressHardwareBackUntil, Date.now() + graceMs)
  pendingFlowRestore = true
}

export function shouldSuppressHardwareBack(): boolean {
  return sessionDepth > 0 || Date.now() < suppressHardwareBackUntil
}

export function peekCameraReturnScreen(): Screen | null {
  return returnScreen
}

export type CameraFlowRestore = {
  consumed: boolean
  returnScreen: Screen | null
}

/** True once after camera/gallery closes — restores the screen the user was on. */
export function consumePendingCameraFlowRestore(): CameraFlowRestore {
  if (!pendingFlowRestore) return { consumed: false, returnScreen: null }
  pendingFlowRestore = false
  const screen = returnScreen
  returnScreen = null
  return { consumed: true, returnScreen: screen }
}

/** @deprecated Use consumePendingCameraFlowRestore */
export function consumePendingBookingFlowRestore(): boolean {
  return consumePendingCameraFlowRestore().consumed
}
