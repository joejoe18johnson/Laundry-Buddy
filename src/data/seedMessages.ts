import type { ChatMessage } from '../types'
import { DEMO_ANA_MARIA_BOOKING_ID } from './seedData'

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
      createdAt: '2026-07-14T13:00:00.000Z',
    },
    {
      id: 'seed-chat-2',
      threadId: DEMO_ANA_MARIA_BOOKING_ID,
      senderId: 'user-maria',
      senderName: 'Maria',
      senderRole: 'host',
      text: 'Hi Ana! I accepted your load. Drop off at 22 Coconut St — gate code 4421. Send your transfer proof here when ready.',
      kind: 'text',
      createdAt: '2026-07-14T13:06:00.000Z',
    },
    {
      id: 'seed-chat-3',
      threadId: DEMO_ANA_MARIA_BOOKING_ID,
      senderId: 'user-ana',
      senderName: 'Ana',
      senderRole: 'customer',
      text: "On my way! I'll send the bank receipt in this chat after I transfer.",
      kind: 'text',
      createdAt: '2026-07-14T13:12:00.000Z',
    },
  ],
}
