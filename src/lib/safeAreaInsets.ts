import { Platform } from 'react-native'
import { spacing } from '../theme'

/** Bottom padding that clears Android 3-button nav when system insets are missing. */
export function bottomSafePadding(insetBottom: number, extra = spacing.md): number {
  const minimum = Platform.OS === 'android' ? 28 : 12
  return Math.max(insetBottom, minimum) + extra
}
