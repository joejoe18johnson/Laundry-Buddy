import { appendThreadMessage } from './messageStorage'
import { buildPaymentRequestMessage } from './chatThreads'
import { formatMoney, getBookingAmount } from './bookingPayments'
import { bookingTrackingLink } from './notificationLinks'
import type { Booking, HostBankDetails, NotificationLink } from '../types'

export const PAYMENT_REQUEST_NOTIFICATION_TITLE = 'Pay now — transfer due'

export function needsPaymentRequest(load: Booking): boolean {
  return (
    load.paymentMethod === 'bank_transfer' &&
    (load.totalAmount ?? 0) > 0 &&
    load.paymentStatus !== 'paid' &&
    !load.paymentRequestedAt
  )
}

export function withPaymentRequestedAt(load: Booking, timestamp = new Date().toISOString()): Booking {
  return { ...load, paymentRequestedAt: load.paymentRequestedAt ?? timestamp }
}

export async function deliverPaymentRequest({
  load,
  hostUserId,
  hostName,
  bankDetails,
  notifyCustomer,
  timestamp = new Date().toISOString(),
}: {
  load: Booking
  hostUserId: string
  hostName: string
  bankDetails: HostBankDetails
  notifyCustomer: (
    customerId: string,
    title: string,
    body: string,
    link?: NotificationLink,
  ) => Promise<void>
  timestamp?: string
}): Promise<void> {
  const amount = getBookingAmount(load)
  const messageText = buildPaymentRequestMessage({
    hostName,
    amount,
    bankName: bankDetails.bankName,
    accountName: bankDetails.accountName,
    accountNumber: bankDetails.accountNumber,
  })

  await appendThreadMessage({
    id: `msg-${Date.now()}-payment-request`,
    threadId: load.id,
    senderId: hostUserId,
    senderName: hostName,
    senderRole: 'host',
    text: messageText,
    kind: 'system',
    createdAt: timestamp,
  })

  if (load.customerId) {
    await notifyCustomer(
      load.customerId,
      PAYMENT_REQUEST_NOTIFICATION_TITLE,
      `${hostName} needs ${formatMoney(amount)} for your load. Open My loads now to transfer and submit proof.`,
      bookingTrackingLink(load.id),
    )
  }
}
