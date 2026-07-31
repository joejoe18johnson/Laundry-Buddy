import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabaseClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/config'

type TypingPayload = {
  userId: string
  userName: string
  typing: boolean
}

export function useChatTyping(
  threadId: string | null,
  userId: string | undefined,
  userName: string,
) {
  const [otherTyping, setOtherTyping] = useState<{ userId: string; userName: string } | null>(null)
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>['channel']> | null>(
    null,
  )
  const expireTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSentRef = useRef(0)

  const broadcast = useCallback(
    (typing: boolean) => {
      const channel = channelRef.current
      if (!channel || !userId) return
      void channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, userName, typing } satisfies TypingPayload,
      })
    },
    [userId, userName],
  )

  const notifyTyping = useCallback(() => {
    if (!threadId || !userId) return
    const now = Date.now()
    if (now - lastSentRef.current > 2000) {
      lastSentRef.current = now
      broadcast(true)
    }
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
    stopTimeoutRef.current = setTimeout(() => broadcast(false), 3000)
  }, [broadcast, threadId, userId])

  const stopTyping = useCallback(() => {
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
    broadcast(false)
  }, [broadcast])

  useEffect(() => {
    if (!threadId || !isSupabaseConfigured() || !userId) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    const channel = supabase.channel(`chat-typing:${threadId}`, {
      config: { broadcast: { self: false } },
    })

    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      const data = payload as TypingPayload
      if (!data?.userId || data.userId === userId) return

      if (data.typing) {
        setOtherTyping({ userId: data.userId, userName: data.userName })
        if (expireTimeoutRef.current) clearTimeout(expireTimeoutRef.current)
        expireTimeoutRef.current = setTimeout(() => setOtherTyping(null), 4000)
      } else {
        setOtherTyping((current) => (current?.userId === data.userId ? null : current))
      }
    })

    void channel.subscribe()
    channelRef.current = channel

    return () => {
      broadcast(false)
      void supabase.removeChannel(channel)
      channelRef.current = null
      if (expireTimeoutRef.current) clearTimeout(expireTimeoutRef.current)
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
    }
  }, [broadcast, threadId, userId])

  return { otherTyping, notifyTyping, stopTyping }
}
