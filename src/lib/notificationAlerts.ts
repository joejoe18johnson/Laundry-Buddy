import { PAYMENT_REQUEST_NOTIFICATION_TITLE } from './paymentRequestDelivery'
import { NEW_BOOKING_NOTIFICATION_TITLE, isNewBookingNotification } from './hostNotifications'
import {
  VERIFICATION_APPROVED_TITLE,
  VERIFICATION_DOC_APPROVED_TITLE,
  VERIFICATION_REJECTED_TITLE,
  VERIFICATION_CODE_SENT_TITLE,
  VERIFICATION_CODE_REQUEST_TITLE,
  NEW_USER_SIGNUP_TITLE,
} from './verificationCodes'

const CRITICAL_NOTIFICATION_TITLES = new Set([
  PAYMENT_REQUEST_NOTIFICATION_TITLE,
  NEW_BOOKING_NOTIFICATION_TITLE,
  VERIFICATION_CODE_SENT_TITLE,
  VERIFICATION_CODE_REQUEST_TITLE,
  NEW_USER_SIGNUP_TITLE,
  VERIFICATION_APPROVED_TITLE,
  VERIFICATION_REJECTED_TITLE,
  VERIFICATION_DOC_APPROVED_TITLE,
  'Request sent',
  'Waiting for your host',
  'Support replied',
  'New message',
  'Leave A Review',
  'Ask For A Review',
  'New Review',
])

/** Whether a notification should also trigger a phone banner/sound alert. */
export function shouldDeliverPhoneAlert(title: string, body = ''): boolean {
  if (CRITICAL_NOTIFICATION_TITLES.has(title) || isNewBookingNotification(title)) {
    return true
  }

  const haystack = `${title} ${body}`.toLowerCase()

  return (
    /pay now|payment request|request sent|load accepted|declined|ready for pickup|marked your load|drying|picked up|drop-off reminder|pay at drop-off|bank transfer|verification code|you're verified|you are verified|verification update|verification step|verification approved|new message|message from|support replied|transfer proof|host is online|awaiting host|proof sent|confirmed your|new review|leave a review|ask for a review|bag received|payment verified|payment confirmed|payment proof|in the dryer|confirm pickup|guest picked up|waiting for your host|accepted your request|sent transfer proof|load is ready|review your|code verified/i.test(
      haystack,
    )
  )
}
