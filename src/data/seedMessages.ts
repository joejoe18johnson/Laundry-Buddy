import type { ChatMessage } from '../types'
import {
  DEMO_ANA_MARIA_BOOKING_ID,
  DEMO_ANA_MARIA_PAY_BOOKING_ID,
} from './seedData'

export const SEED_CHAT_THREADS: Record<string, ChatMessage[]> = {
  [DEMO_ANA_MARIA_BOOKING_ID]: [
    {
      id: 'seed-chat-1',
      threadId: DEMO_ANA_MARIA_BOOKING_ID,
      senderId: 'user-ana',
      senderName: 'Ana',
      senderRole: 'customer',
      text: 'Hi Maria! I booked a drop-off around 9am — mostly towels, low heat please.',
      kind: 'text',
      createdAt: '2026-07-18T12:35:00.000Z',
    },
    {
      id: 'seed-chat-2',
      threadId: DEMO_ANA_MARIA_BOOKING_ID,
      senderId: 'user-maria',
      senderName: 'Maria',
      senderRole: 'host',
      text: 'Payment request · BZ$3.00\n\nTransfer to Belize Bank · Maria Castillo · 1234567890\n\nSubmit your transfer screenshot from My loads when done.',
      kind: 'system',
      createdAt: '2026-07-18T12:40:00.000Z',
    },
  ],
  [DEMO_ANA_MARIA_PAY_BOOKING_ID]: [
    {
      id: 'seed-chat-pay-1',
      threadId: DEMO_ANA_MARIA_PAY_BOOKING_ID,
      senderId: 'user-ana',
      senderName: 'Ana',
      senderRole: 'customer',
      text: 'Hi Maria — work shirts for this afternoon drop-off. Thanks!',
      kind: 'text',
      createdAt: '2026-07-18T14:25:00.000Z',
    },
    {
      id: 'seed-chat-pay-2',
      threadId: DEMO_ANA_MARIA_PAY_BOOKING_ID,
      senderId: 'user-maria',
      senderName: 'Maria',
      senderRole: 'host',
      text: 'Payment request · BZ$6.00\n\nTransfer to Belize Bank · Maria Castillo · 1234567890\n\nSubmit your transfer screenshot from My loads when done.',
      kind: 'system',
      createdAt: '2026-07-18T15:00:00.000Z',
    },
  ],
}
