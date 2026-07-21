import { useMemo } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { AppIcon } from '../../components/AppIcon'
import { Screen } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import { useAdminSupportMessages } from '../../hooks/useAdminSupportMessages'
import { toTitleCase } from '../../lib/titleCase'
import { spacing } from '../../theme'
import { createAdminStyles } from './adminStyles'

type Props = {
  refreshKey?: number
  onOpenThread: (threadId: string, title: string) => void
}

export function AdminSupportMessagesScreen({ refreshKey, onOpenThread }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createAdminStyles(colors), [colors])
  const { threads, loading, formatUserLabel } = useAdminSupportMessages(refreshKey)

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {toTitleCase('In-app support conversations from guests and hosts — reply here.')}
        </Text>

        {loading ? (
          <Text style={styles.cardMeta}>{toTitleCase('Loading…')}</Text>
        ) : threads.length === 0 ? (
          <View style={styles.card}>
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
              <AppIcon name="message-circle" size={28} color={colors.gray400} />
              <Text style={styles.cardName}>{toTitleCase('No support messages yet')}</Text>
              <Text style={[styles.cardMeta, { textAlign: 'center' }]}>
                {toTitleCase('When someone contacts support from the app, their thread appears here.')}
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {threads.map((row) => {
            const title = row.user?.name ?? 'Support request'
            const subtitle = formatUserLabel(row.user)

            return (
              <Pressable
                key={row.threadId}
                style={({ pressed }) => [
                  styles.navCard,
                  row.unread > 0 && styles.cardHighlighted,
                  pressed && styles.navCardPressed,
                ]}
                onPress={() => onOpenThread(row.threadId, title)}
              >
                <View style={styles.navIconWrap}>
                  <AppIcon name="message-circle" size={20} />
                </View>
                <View style={styles.navCopy}>
                  <Text style={styles.navTitle}>{title}</Text>
                  <Text style={styles.navSub}>{subtitle}</Text>
                  <Text style={styles.cardMeta} numberOfLines={2}>
                    {row.preview}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  {row.time ? <Text style={styles.cardMeta}>{row.time}</Text> : null}
                  {row.unread > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{row.unread > 9 ? '9+' : row.unread}</Text>
                    </View>
                  ) : (
                    <AppIcon name="chevron-right" size={18} color={colors.gray400} />
                  )}
                </View>
              </Pressable>
            )
          })}
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}
