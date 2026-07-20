import AsyncStorage from '@react-native-async-storage/async-storage'

const TOUR_SEEN_PREFIX = 'laundry-buddy-verification-tour:'

function tourKey(userId: string): string {
  return `${TOUR_SEEN_PREFIX}${userId}`
}

export async function hasSeenVerificationTour(userId: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(tourKey(userId))
  return value === 'true'
}

export async function markVerificationTourSeen(userId: string): Promise<void> {
  await AsyncStorage.setItem(tourKey(userId), 'true')
}
