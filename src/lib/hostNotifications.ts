export const NEW_BOOKING_NOTIFICATION_TITLE = 'New booking'

export function isNewBookingNotification(title: string): boolean {
  return title.trim().toLowerCase() === NEW_BOOKING_NOTIFICATION_TITLE.toLowerCase()
}
