import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon } from '../../components/AppIcon'
import { BrandActionSheet, BrandAlert, type BrandDialogAction } from '../../components/BrandDialog'
import { ImageLightbox } from '../../components/ImageLightbox'
import { PaymentProofChip } from '../../components/PaymentProofChip'
import { AppTextInput, BackButton, PrimaryButton, SuccessButton } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { formatChatTime, senderRoleLabel, useMessages } from '../../context/MessageContext'
import { useTheme } from '../../context/ThemeContext'
import {
  getChatThreadSubtitle,
  getChatThreadTitle,
  isInquiryThread,
  isSupportThread,
} from '../../lib/chatThreads'
import { toTitleCase } from '../../lib/titleCase'
import { radius, spacing } from '../../theme'
import type { Booking, ChatMessage } from '../../types'

function ChatMessageImage({
  uri,
  style,
  onPress,
}: {
  uri: string
  style: ReturnType<typeof createStyles>['image']
  onPress: (uri: string) => void
}) {
  return (
    <Pressable
      onPress={() => onPress(uri)}
      accessibilityRole="imagebutton"
      accessibilityLabel="View full image"
    >
      <Image source={{ uri }} style={style} resizeMode="cover" />
    </Pressable>
  )
}

function renderPaymentProofContent(
  message: ChatMessage,
  isOwn: boolean,
  styles: ReturnType<typeof createStyles>,
  onImagePress: (uri: string) => void,
  confirmed?: boolean,
) {
  if (message.imageUri) {
    return (
      <PaymentProofChip
        compact
        confirmed={confirmed}
        onPress={() => onImagePress(message.imageUri!)}
      />
    )
  }

  return message.text ? (
    <Text style={[styles.body, isOwn && styles.bodyOwn]}>{message.text}</Text>
  ) : null
}

function MessageBubble({
  message,
  isOwn,
  colors,
  styles,
  onImagePress,
  paymentConfirmed,
}: {
  message: ChatMessage
  isOwn: boolean
  colors: ReturnType<typeof useTheme>['colors']
  styles: ReturnType<typeof createStyles>
  onImagePress: (uri: string) => void
  paymentConfirmed?: boolean
}) {
  const isSystem = message.kind === 'system' || message.senderRole === 'support'

  if (isSystem && !isOwn) {
    return (
      <View style={styles.systemWrap}>
        <View style={styles.systemBubble}>
          {message.kind === 'payment_proof' ? (
            <Text style={styles.systemLabel}>{toTitleCase('Payment proof')}</Text>
          ) : null}
          {message.text && message.kind !== 'payment_proof' ? (
            <Text style={styles.systemText}>{message.text}</Text>
          ) : null}
          {message.kind === 'payment_proof'
            ? renderPaymentProofContent(message, isOwn, styles, onImagePress, paymentConfirmed)
            : message.imageUri ? (
                <ChatMessageImage uri={message.imageUri} style={styles.image} onPress={onImagePress} />
              ) : null}
          <Text style={styles.systemTime}>{formatChatTime(message.createdAt)}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn ? (
          <Text style={styles.sender}>
            {message.senderName} · {senderRoleLabel(message.senderRole)}
          </Text>
        ) : null}
        {message.kind === 'payment_proof' ? (
          <Text style={styles.proofLabel}>{toTitleCase('Payment proof')}</Text>
        ) : null}
        {message.kind === 'payment_proof' ? (
          renderPaymentProofContent(message, isOwn, styles, onImagePress, paymentConfirmed)
        ) : (
          <>
            {message.text ? <Text style={[styles.body, isOwn && styles.bodyOwn]}>{message.text}</Text> : null}
            {message.imageUri ? (
              <ChatMessageImage uri={message.imageUri} style={styles.image} onPress={onImagePress} />
            ) : null}
          </>
        )}
        <Text style={[styles.time, isOwn && styles.timeOwn]}>{formatChatTime(message.createdAt)}</Text>
      </View>
    </View>
  )
}

export function ChatThreadPanel({
  threadId,
  booking,
  onBack,
  showBackButton = true,
  onConfirmPayment,
  onPaymentProofSent,
  titleOverride,
  subtitleOverride,
}: {
  threadId: string
  booking?: Booking | null
  onBack?: () => void
  showBackButton?: boolean
  onConfirmPayment?: () => void
  onPaymentProofSent?: (proofUri: string) => void
  titleOverride?: string
  subtitleOverride?: string
}) {
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const { getMessages, refreshThread, sendMessage, markRead } = useMessages()
  const [draft, setDraft] = useState('')
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null)
  const [lightboxUri, setLightboxUri] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [attachSheetOpen, setAttachSheetOpen] = useState(false)
  const [permissionAlert, setPermissionAlert] = useState<{ title: string; message: string } | null>(null)
  const listRef = useRef<FlatList<ChatMessage>>(null)

  const messages = getMessages(threadId)
  const title = titleOverride ?? getChatThreadTitle(threadId, user!, booking)
  const subtitle = subtitleOverride ?? getChatThreadSubtitle(threadId, booking)
  const isSupport = isSupportThread(threadId)
  const isBankTransfer = booking?.paymentMethod === 'bank_transfer'
  const paymentPending = isBankTransfer && booking?.paymentStatus === 'pending'
  const paymentConfirmed = isBankTransfer && booking?.paymentStatus === 'paid'
  const canConfirmPayment =
    !!onConfirmPayment &&
    !isSupport &&
    user?.role === 'host' &&
    paymentPending

  useEffect(() => {
    if (!threadId) return
    void refreshThread(threadId).then(() => markRead(threadId))
  }, [threadId, refreshThread, markRead])

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height)
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true })
      }, Platform.OS === 'ios' ? event.duration ?? 100 : 100)
    })
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0)
    })
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  const scrollToLatest = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true })
  }, [])

  useEffect(() => {
    if (messages.length === 0) return
    scrollToLatest()
  }, [messages.length, scrollToLatest])

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      setPermissionAlert({
        title: 'Permission needed',
        message: useCamera
          ? 'Allow camera access to attach a photo.'
          : 'Allow photo library access to attach an image.',
      })
      return
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })

    if (!result.canceled && result.assets[0]?.uri) {
      setPendingImageUri(result.assets[0].uri)
    }
  }

  const attachSheetActions: BrandDialogAction[] = [
    {
      label: 'Take photo',
      icon: 'camera',
      variant: 'primary',
      onPress: () => {
        setAttachSheetOpen(false)
        void pickImage(true)
      },
    },
    {
      label: 'Choose photo',
      icon: 'image',
      variant: 'outline',
      onPress: () => {
        setAttachSheetOpen(false)
        void pickImage(false)
      },
    },
    ...(pendingImageUri
      ? [
          {
            label: 'Remove photo',
            icon: 'trash-2' as const,
            variant: 'danger' as const,
            onPress: () => {
              setAttachSheetOpen(false)
              setPendingImageUri(null)
            },
          },
        ]
      : []),
    {
      label: 'Cancel',
      variant: 'ghost',
      onPress: () => setAttachSheetOpen(false),
    },
  ]

  const showAttachOptions = () => {
    setAttachSheetOpen(true)
  }

  const handleSend = useCallback(async () => {
    if (!threadId || sending) return
    const trimmed = draft.trim()
    if (!trimmed && !pendingImageUri) return

    setSending(true)
    try {
      await sendMessage({
        threadId,
        text: trimmed || undefined,
        imageUri: pendingImageUri ?? undefined,
        booking,
        paymentProof: !!pendingImageUri && booking?.paymentMethod === 'bank_transfer',
      })
      if (pendingImageUri && booking?.paymentMethod === 'bank_transfer') {
        onPaymentProofSent?.(pendingImageUri)
      }
      setDraft('')
      setPendingImageUri(null)
      Keyboard.dismiss()
      await refreshThread(threadId)
    } finally {
      setSending(false)
    }
  }, [booking, draft, onPaymentProofSent, pendingImageUri, refreshThread, sendMessage, sending, threadId])

  if (!user || !threadId) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{toTitleCase('No conversation selected')}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.wrap, { paddingBottom: keyboardHeight }]}>
        <View style={styles.header}>
        {showBackButton && onBack ? <BackButton onPress={onBack} label="Back" /> : null}
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {canConfirmPayment ? (
        <View style={styles.paymentBanner}>
          <AppIcon name="credit-card" size={16} color={colors.black} />
          <Text style={styles.paymentBannerText}>
            {toTitleCase('Guest may send transfer proof here. Confirm once verified.')}
          </Text>
          <PrimaryButton
            title="Confirm payment"
            icon="check-circle"
            onPress={onConfirmPayment}
          />
        </View>
      ) : paymentConfirmed && !isSupport && user?.role === 'host' ? (
        <View style={[styles.paymentBanner, styles.paymentBannerConfirmed]}>
          <SuccessButton title="Payment confirmed" icon="check-circle" full disabled />
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        style={styles.flex}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={scrollToLatest}
        onLayout={scrollToLatest}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isOwn={item.senderId === user.id}
            colors={colors}
            styles={styles}
            onImagePress={setLightboxUri}
            paymentConfirmed={paymentConfirmed}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyThread}>
            <AppIcon name="message-circle" size={28} color={colors.gray400} />
            <Text style={styles.emptyThreadTitle}>{toTitleCase('Start the conversation')}</Text>
            <Text style={styles.emptyThreadSub}>
              {isSupport
                ? toTitleCase('Ask for help with your account here.')
                : toTitleCase('Send messages and payment screenshots without leaving the app.')}
            </Text>
          </View>
        }
      />

      {pendingImageUri ? (
        <View style={styles.pendingImageWrap}>
          <Image source={{ uri: pendingImageUri }} style={styles.pendingImage} resizeMode="cover" />
          <Pressable onPress={() => setPendingImageUri(null)} style={styles.removePending}>
            <AppIcon name="x" size={14} color={colors.white} />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <Pressable onPress={showAttachOptions} style={styles.attachBtn} hitSlop={8}>
          <AppIcon name="image" size={22} color={colors.black} />
        </Pressable>
        <AppTextInput
          style={styles.input}
          placeholder="Write a message"
          value={draft}
          onChangeText={setDraft}
          onFocus={scrollToLatest}
          multiline
          maxLength={1000}
        />
        <Pressable
          onPress={() => void handleSend()}
          disabled={sending || (!draft.trim() && !pendingImageUri)}
          style={[styles.sendBtn, (!draft.trim() && !pendingImageUri) && styles.sendBtnDisabled]}
        >
          <AppIcon name="send" size={18} color={colors.white} />
        </Pressable>
      </View>
      <ImageLightbox
        visible={!!lightboxUri}
        imageUri={lightboxUri}
        onClose={() => setLightboxUri(null)}
      />

      <BrandActionSheet
        visible={attachSheetOpen}
        title="Attach photo"
        message="Send a screenshot or photo in this chat."
        icon="image"
        actions={attachSheetActions}
        onClose={() => setAttachSheetOpen(false)}
      />

      <BrandAlert
        visible={!!permissionAlert}
        title={permissionAlert?.title ?? ''}
        message={permissionAlert?.message}
        icon="alert-circle"
        onClose={() => setPermissionAlert(null)}
      />
    </View>
  )
}

export function ChatScreen() {
  const { chatThreadId, chatBooking, closeChat, confirmTransferPayment, markPaymentProofSent, findBookingForChat } =
    useApp()
  if (!chatThreadId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>{toTitleCase('No conversation selected')}</Text>
      </View>
    )
  }

  const liveBooking =
    chatThreadId && !isSupportThread(chatThreadId) && !isInquiryThread(chatThreadId)
      ? findBookingForChat(chatThreadId) ?? chatBooking
      : isInquiryThread(chatThreadId ?? '')
        ? null
        : chatBooking

  return (
    <ChatThreadPanel
      threadId={chatThreadId}
      booking={liveBooking}
      onBack={closeChat}
      onConfirmPayment={
        liveBooking ? () => confirmTransferPayment(liveBooking.id) : undefined
      }
      onPaymentProofSent={
        liveBooking ? (proofUri) => markPaymentProofSent(liveBooking.id, proofUri) : undefined
      }
    />
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.white },
    flex: { flex: 1 },
    header: {
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray100,
      gap: spacing.sm,
    },
    headerCopy: { gap: 2 },
    title: { fontSize: 20, fontWeight: '700', color: colors.black },
    subtitle: { fontSize: 13, color: colors.gray500 },
    paymentBanner: {
      marginHorizontal: spacing.screen,
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.gray200,
      backgroundColor: colors.gray50,
      gap: spacing.sm,
    },
    paymentBannerText: { fontSize: 13, color: colors.gray600, lineHeight: 18 },
    paymentBannerConfirmed: {
      borderColor: colors.green,
      backgroundColor: colors.greenBg,
    },
    listContent: {
      paddingHorizontal: spacing.screen,
      paddingVertical: spacing.md,
      flexGrow: 1,
      gap: spacing.sm,
    },
    row: { flexDirection: 'row', marginBottom: spacing.sm },
    rowOwn: { justifyContent: 'flex-end' },
    rowOther: { justifyContent: 'flex-start' },
    bubble: {
      maxWidth: '82%',
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    bubbleOwn: { backgroundColor: colors.black },
    bubbleOther: { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray100 },
    sender: { fontSize: 11, fontWeight: '600', color: colors.gray500 },
    proofLabel: { fontSize: 11, fontWeight: '700', color: colors.gray500, letterSpacing: 0.4 },
    body: { fontSize: 15, lineHeight: 21, color: colors.black },
    bodyOwn: { color: colors.white },
    image: { width: 220, height: 160, borderRadius: radius.md, backgroundColor: colors.gray100 },
    time: { fontSize: 11, color: colors.gray500, alignSelf: 'flex-end' },
    timeOwn: { color: 'rgba(255,255,255,0.75)' },
    systemWrap: { alignItems: 'center', marginVertical: spacing.sm },
    systemBubble: {
      maxWidth: '92%',
      backgroundColor: colors.gray50,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    systemLabel: { fontSize: 11, fontWeight: '700', color: colors.gray500 },
    systemText: { fontSize: 14, color: colors.gray600, lineHeight: 20, textAlign: 'center' },
    systemTime: { fontSize: 11, color: colors.gray400, textAlign: 'center' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 16, color: colors.gray500 },
    emptyThread: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
    emptyThreadTitle: { fontSize: 16, fontWeight: '600', color: colors.black },
    emptyThreadSub: { fontSize: 14, color: colors.gray500, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.lg },
    pendingImageWrap: {
      marginHorizontal: spacing.screen,
      marginBottom: spacing.sm,
      alignSelf: 'flex-start',
    },
    pendingImage: { width: 88, height: 88, borderRadius: radius.md },
    removePending: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.black,
      alignItems: 'center',
      justifyContent: 'center',
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.gray100,
      backgroundColor: colors.white,
    },
    attachBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.gray50,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: colors.gray200,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      backgroundColor: colors.white,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.black,
    },
    sendBtnDisabled: { opacity: 0.45 },
  })
}
