import { PAYMENT_REQUEST_NOTIFICATION_TITLE } from './paymentRequestDelivery'
import { NEW_BOOKING_NOTIFICATION_TITLE, isNewBookingNotification } from './hostNotifications'
import {
  VERIFICATION_APPROVED_TITLE,
  VERIFICATION_CODE_REQUEST_TITLE,
  VERIFICATION_CODE_SENT_TITLE,
} from './verificationCodes'

/** Whether a notification should also trigger a phone banner/sound alert. */
export function shouldDeliverPhoneAlert(title: string, body = ''): boolean {
  const haystack = `${title} ${body}`.toLowerCase()

  if (
    title === PAYMENT_REQUEST_NOTIFICATION_TITLE ||
    title === NEW_BOOKING_NOTIFICATION_TITLE ||
    title === VERIFICATION_CODE_SENT_TITLE ||
    title === VERIFICATION_CODE_REQUEST_TITLE ||
    title === VERIFICATION_APPROVED_TITLE ||
    isNewBookingNotification(title)
  ) {
    return true
  }

  return (
    /pay now|payment request|request sent|load accepted|declined|ready for pickup|marked your load|drying|picked up|drop-off reminder|pay at drop-off|bank transfer|verification code|you're verified|you are verified|new message|message from|transfer proof|host is online|awaiting host|proof sent|confirmed your/i.test(
      haystack,
    )
  )
}
