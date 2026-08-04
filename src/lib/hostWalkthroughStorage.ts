import AsyncStorage from '@react-native-async-storage/async-storage'

const WALKTHROUGH_SEEN_PREFIX = 'laundry-buddy-host-booking-walkthrough:'

function walkthroughKey(userId: string): string {
  return `${WALKTHROUGH_SEEN_PREFIX}${userId}`
}

export async function hasSeenHostBookingWalkthrough(userId: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(walkthroughKey(userId))
  return value === 'true'
}

export async function markHostBookingWalkthroughSeen(userId: string): Promise<void> {
  await AsyncStorage.setItem(walkthroughKey(userId), 'true')
}
