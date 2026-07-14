import AsyncStorage from '@react-native-async-storage/async-storage'

const INTRO_SEEN_KEY = 'laundry-buddy-intro-seen-v2'

export async function hasSeenIntro(): Promise<boolean> {
  const value = await AsyncStorage.getItem(INTRO_SEEN_KEY)
  return value === 'true'
}

export async function markIntroSeen(): Promise<void> {
  await AsyncStorage.setItem(INTRO_SEEN_KEY, 'true')
}
