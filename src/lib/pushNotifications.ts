import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { formatDropOffHour, type DropOffHour } from './dropOffAvailability'
import { bookingTrackingLink, linkToPushData } from './notificationLinks'

const PERMISSION_PROMPT_KEY = 'laundry-buddy-notif-permission-prompted'
const ANDROID_CHANNEL_ID = 'laundry-buddy-updates'

let initialized = false

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported'

export async function initPushNotifications(): Promise<void> {
  if (initialized || Platform.OS === 'web' || !Device.isDevice) return

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Laundry Buddy updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#000000',
      sound: 'default',
    })
  }

  initialized = true
}

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  if (Platform.OS === 'web' || !Device.isDevice) return 'unsupported'
  const settings = await Notifications.getPermissionsAsync()
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return 'granted'
  }
  if (settings.canAskAgain === false) return 'denied'
  return 'undetermined'
}

export async function requestPushPermissions(): Promise<boolean> {
  if (Platform.OS === 'web' || !Device.isDevice) return false
  await initPushNotifications()

  const current = await Notifications.getPermissionsAsync()
  let settings = current

  if (!current.granted) {
    settings = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    })
  }

  await markPermissionPrompted()
  return (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  )
}

export async function shouldShowPermissionPrompt(): Promise<boolean> {
  return shouldPromptForPushAfterAuth()
}

/** Show the in-app prompt after login/signup when push is not already granted. */
export async function shouldPromptForPushAfterAuth(): Promise<boolean> {
  if (Platform.OS === 'web' || !Device.isDevice) return false
  const status = await getPushPermissionStatus()
  return status !== 'granted'
}

export async function markPermissionPrompted(): Promise<void> {
  await AsyncStorage.setItem(PERMISSION_PROMPT_KEY, 'true')
}

export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return
  const status = await getPushPermissionStatus()
  if (status !== 'granted') return

  await initPushNotifications()
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: null,
  })
}

export async function scheduleDropOffReminder(
  bookingId: string,
  hostName: string,
  dropOffHour: DropOffHour,
): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return
  const status = await getPushPermissionStatus()
  if (status !== 'granted') return

  await initPushNotifications()

  const triggerDate = new Date()
  triggerDate.setHours(dropOffHour, 0, 0, 0)
  triggerDate.setMinutes(triggerDate.getMinutes() - 30)

  if (triggerDate.getTime() <= Date.now()) return

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Drop-off reminder',
      body: `Head to ${hostName} — your window starts at ${formatDropOffHour(dropOffHour)}.`,
      data: linkToPushData(bookingTrackingLink(bookingId)),
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  })
}

export async function updateBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return
  try {
    await Notifications.setBadgeCountAsync(count)
  } catch {
    // badge not supported on all platforms
  }
}

export function addNotificationResponseListener(
  listener: (title: string, data: Record<string, unknown>) => void,
) {
  if (Platform.OS === 'web') return { remove: () => {} }

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const content = response.notification.request.content
    listener(content.title ?? 'Notification', (content.data ?? {}) as Record<string, unknown>)
  })

  return subscription
}
