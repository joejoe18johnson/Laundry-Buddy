import AsyncStorage from '@react-native-async-storage/async-storage'
import { isFullFlowTesting } from './testingFlow'

const INTRO_SEEN_KEY = 'laundry-buddy-intro-seen-v3'

export async function hasSeenIntro(): Promise<boolean> {
  if (isFullFlowTesting()) return false
  const value = await AsyncStorage.getItem(INTRO_SEEN_KEY)
  return value === 'true'
}

export async function markIntroSeen(): Promise<void> {
  if (isFullFlowTesting()) return
  await AsyncStorage.setItem(INTRO_SEEN_KEY, 'true')
}
