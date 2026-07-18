import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { PrimaryButton, Screen } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { formatChatTime, useMessages } from '../../context/MessageContext'
import { useTheme } from '../../context/ThemeContext'
import {
  getChatThreadSubtitle,
  getChatThreadTitle,
  isSupportThread,
  messagePreview,
  supportThreadId,
} from '../../lib/chatThreads'
import { countUnreadInThread, loadAllThreadIds, loadThreadMessages } from '../../lib/messageStorage'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'
import type { Booking } from '../../types'

type ThreadRow = {
  threadId: string
  title: string
  subtitle?: string
  preview: string
  time?: string
  unread: number
  bookingId?: string
}

function createMessagesStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    title: { fontSize: 26, fontWeight: '700', lineHeight: 32, color: colors.black },
    subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 22 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: colors.white,
    },
    rowUnread: { borderColor: colors.black, backgroundColor: colors.gray50 },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.gray100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: { flex: 1, gap: 4 },
    rowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
    rowTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.black },
    rowTime: { fontSize: 12, color: colors.gray400 },
    rowPreview: { fontSize: 14, color: colors.gray500, lineHeight: 20 },
    rowSub: { fontSize: 12, color: colors.gray400 },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
      backgroundColor: colors.black,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadBadgeText: { fontSize: 11, fontWeight: '700', color: colors.white },
    empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.black },
    emptySub: { fontSize: 14, color: colors.gray500, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.lg },
  })
}

function buildBookingThreadIds(
  isCustomer: boolean,
  activeGuestBookings: Booking[],
  hostRequests: { id: string }[],
  activeLoads: Booking[],
): string[] {
  if (isCustomer) {
    return activeGuestBookings.map((entry) => entry.id)
  }
  return [...hostRequests.map((entry) => entry.id), ...activeLoads.map((entry) => entry.id)]
}

export function MessagesScreen() {
  const { user } = useAuth()
  const {
    screen,
    openChat,
    openSupportChat,
    activeGuestBookings,
    hostRequests,
    activeLoads,
    findBookingForChat,
  } = useApp()
  const { colors } = useTheme()
  const styles = useMemo(() => createMessagesStyles(colors), [colors])
  const { refreshThreads } = useMessages()
  const [threads, setThreads] = useState<ThreadRow[]>([])

  const isCustomer = user!.role === 'customer'

  const reload = useCallback(async () => {
    if (!user) return

    const supportId = supportThreadId(user.id)
    const bookingIds = buildBookingThreadIds(isCustomer, activeGuestBookings, hostRequests, activeLoads)
    const storedIds = await loadAllThreadIds()
    const threadIds = Array.from(
      new Set([
        supportId,
        ...bookingIds,
        ...storedIds.filter((id) => !isSupportThread(id) || id === supportId),
      ]),
    )

    const rows = await Promise.all(
      threadIds.map(async (threadId) => {
        const messages = await loadThreadMessages(threadId)
        const last = messages[messages.length - 1]
        const booking = isSupportThread(threadId) ? null : findBookingForChat(threadId)
        const unread = await countUnreadInThread(user.id, threadId, messages)

        return {
          threadId,
          title: getChatThreadTitle(threadId, user, booking),
          subtitle: getChatThreadSubtitle(threadId, booking),
          preview: last ? messagePreview(last) : toTitleCase('No messages yet'),
          time: last ? formatChatTime(last.createdAt) : undefined,
          unread,
          bookingId: isSupportThread(threadId) ? undefined : threadId,
          lastCreatedAt: last?.createdAt,
        }
      }),
    )

    await refreshThreads(threadIds)

    const visible = rows.filter(
      (row) =>
        isSupportThread(row.threadId) ||
        bookingIds.includes(row.threadId) ||
        row.lastCreatedAt,
    )

    visible.sort((a, b) => {
      const aMs = a.lastCreatedAt ? Date.parse(a.lastCreatedAt) : 0
      const bMs = b.lastCreatedAt ? Date.parse(b.lastCreatedAt) : 0
      if (aMs !== bMs) return bMs - aMs
      if (isSupportThread(a.threadId)) return 1
      if (isSupportThread(b.threadId)) return -1
      return a.title.localeCompare(b.title)
    })

    setThreads(
      visible.map(({ lastCreatedAt: _lastCreatedAt, ...row }) => row),
    )
  }, [
    activeGuestBookings,
    activeLoads,
    findBookingForChat,
    hostRequests,
    isCustomer,
    refreshThreads,
    user,
  ])

  useEffect(() => {
    if (screen !== 'messages' || !user) return
    void reload()
  }, [screen, user, reload])

  const openThread = (row: ThreadRow) => {
    if (row.bookingId) {
      openChat(row.threadId, row.bookingId)
      return
    }
    openSupportChat()
  }

  return (
    <Screen>
      <View style={styles.titleRow}>
        <AppIcon name="message-circle" size={22} />
        <Text style={styles.title}>{toTitleCase('Messages')}</Text>
      </View>
      <Text style={styles.subtitle}>
        {toTitleCase('Load chats with your host or guest, plus support when you need help.')}
      </Text>

      {threads.length === 0 ? (
        <View style={styles.empty}>
          <AppIcon name="message-circle" size={32} color={colors.gray400} />
          <Text style={styles.emptyTitle}>{toTitleCase('No conversations yet')}</Text>
          <Text style={styles.emptySub}>
            {toTitleCase(
              isCustomer
                ? 'Book a load or message support — your chats will appear here.'
                : 'When guests message you or send payment proof, threads show up here.',
            )}
          </Text>
          <PrimaryButton title="Message support" icon="message-circle" onPress={openSupportChat} />
        </View>
      ) : (
        threads.map((row) => (
          <Pressable
            key={row.threadId}
            style={[styles.row, row.unread > 0 && styles.rowUnread]}
            onPress={() => openThread(row)}
          >
            <View style={styles.avatar}>
              <AppIcon
                name={isSupportThread(row.threadId) ? 'life-buoy' : isCustomer ? 'user' : 'package'}
                size={20}
                color={colors.black}
              />
            </View>
            <View style={styles.rowBody}>
              <View style={styles.rowTop}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {row.title}
                </Text>
                {row.time ? <Text style={styles.rowTime}>{row.time}</Text> : null}
              </View>
              {row.subtitle ? <Text style={styles.rowSub}>{row.subtitle}</Text> : null}
              <Text style={styles.rowPreview} numberOfLines={2}>
                {row.preview}
              </Text>
            </View>
            {row.unread > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{row.unread > 9 ? '9+' : row.unread}</Text>
              </View>
            ) : null}
          </Pressable>
        ))
      )}
    </Screen>
  )
}
