import type { ChatMessage } from '../types'

/** WhatsApp-style chat date/time formatting. */

export function formatChatTime(iso: string): string {
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return ''
  return new Date(parsed).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function isSameChatDay(aIso: string, bIso: string): boolean {
  const a = Date.parse(aIso)
  const b = Date.parse(bIso)
  if (Number.isNaN(a) || Number.isNaN(b)) return false
  return startOfLocalDay(new Date(a)) === startOfLocalDay(new Date(b))
}

/** Centered date pill label — Today, Yesterday, weekday, or full date. */
export function formatChatDateDivider(iso: string): string {
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return ''
  const date = new Date(parsed)
  const today = startOfLocalDay(new Date())
  const day = startOfLocalDay(date)
  const diffDays = Math.round((today - day) / 86_400_000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'

  const now = new Date()
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export type ChatListItem =
  | { kind: 'date'; id: string; label: string }
  | { kind: 'message'; id: string; message: ChatMessage }

export function buildChatListItems(messages: ChatMessage[]): ChatListItem[] {
  const items: ChatListItem[] = []
  let lastDay: string | null = null

  for (const message of messages) {
    const dayKey = formatChatDateDivider(message.createdAt)
    if (dayKey && dayKey !== lastDay) {
      items.push({ kind: 'date', id: `date-${items.length}-${message.createdAt}`, label: dayKey })
      lastDay = dayKey
    }
    items.push({ kind: 'message', id: message.id, message })
  }

  return items
}
