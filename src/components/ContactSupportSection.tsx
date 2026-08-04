import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_WHATSAPP } from '../lib/supportContact'
import { openWhatsAppChat } from '../lib/whatsapp'
import { toTitleCase } from '../lib/titleCase'
import { radius, spacing } from '../theme'

function buildSupportWhatsAppMessage(name?: string): string {
  if (name?.trim()) {
    return `Hi Laundry Buddy support, I need help with my account (${name.trim()}).`
  }
  return 'Hi Laundry Buddy support, I need help with my account.'
}

export function ContactSupportSection() {
  const { openSupportChat } = useApp()
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const handleWhatsApp = () => {
    void openWhatsAppChat(SUPPORT_PHONE_WHATSAPP, buildSupportWhatsAppMessage(user?.name))
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>{toTitleCase('Contact support')}</Text>
      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          onPress={openSupportChat}
          accessibilityRole="button"
          accessibilityLabel={toTitleCase('Message support in app')}
        >
          <View style={styles.actionIcon}>
            <AppIcon name="message-circle" size={18} color={colors.black} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionLabel}>{toTitleCase('In-app messages')}</Text>
            <Text style={styles.actionSub}>
              {toTitleCase('Chat with our team — replies show up in Messages')}
            </Text>
          </View>
          <AppIcon name="chevron-right" size={18} color={colors.gray400} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          onPress={handleWhatsApp}
          accessibilityRole="button"
          accessibilityLabel={toTitleCase('Contact support on WhatsApp')}
        >
          <View style={[styles.actionIcon, styles.whatsappIcon]}>
            <AppIcon name="phone" size={18} color={colors.green} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionLabel}>{toTitleCase('WhatsApp support')}</Text>
            <Text style={styles.actionSub}>
              {toTitleCase(`Message us on WhatsApp · +501 ${SUPPORT_PHONE_DISPLAY}`)}
            </Text>
          </View>
          <AppIcon name="external-link" size={18} color={colors.gray400} />
        </Pressable>
      </View>
    </View>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.lg },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.gray500,
      letterSpacing: 0.4,
      marginBottom: spacing.sm,
    },
    card: {
      borderWidth: 1,
      borderColor: colors.gray100,
      borderRadius: radius.lg,
      backgroundColor: colors.white,
      overflow: 'hidden',
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    actionBtnPressed: { backgroundColor: colors.gray50 },
    actionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.gray50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    whatsappIcon: { backgroundColor: colors.greenBg },
    actionCopy: { flex: 1, gap: 2 },
    actionLabel: { fontSize: 15, fontWeight: '600', color: colors.black },
    actionSub: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
    divider: { height: 1, backgroundColor: colors.gray100, marginHorizontal: spacing.md },
  })
}
