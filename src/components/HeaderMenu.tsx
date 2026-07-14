import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import { colors, radius, spacing } from '../theme'
import type { User } from '../types'

type Props = {
  visible: boolean
  user: User
  onClose: () => void
  onPastLoads: () => void
  onLogout: () => void
}

export function HeaderMenu({ visible, user, onClose, onPastLoads, onLogout }: Props) {
  const isCustomer = user.role === 'customer'
  const contact = user.email ?? user.phone

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={['top', 'right']} style={styles.panelInner}>
            <View style={styles.header}>
              <View style={styles.profileIcon}>
                <AppIcon name="user" size={20} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.role}>{isCustomer ? 'Guest' : 'Host'}</Text>
                {contact ? <Text style={styles.contact}>{contact}</Text> : null}
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                <AppIcon name="x" size={20} color={colors.gray500} />
              </Pressable>
            </View>

            <View style={styles.menu}>
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => {
                  onClose()
                  onPastLoads()
                }}
              >
                <AppIcon name="clock" size={20} />
                <Text style={styles.menuLabel}>{isCustomer ? 'Past loads' : 'Load history'}</Text>
                <AppIcon name="chevron-right" size={18} color={colors.gray400} />
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Pressable
                style={({ pressed }) => [styles.logoutItem, pressed && styles.menuItemPressed]}
                onPress={() => {
                  onClose()
                  onLogout()
                }}
              >
                <AppIcon name="log-out" size={20} />
                <Text style={styles.logoutLabel}>Log out</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'flex-end',
  },
  panel: {
    width: '82%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: colors.white,
    borderLeftWidth: 1,
    borderLeftColor: colors.gray100,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  panelInner: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: colors.black },
  role: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  contact: { fontSize: 12, color: colors.gray400, marginTop: spacing.sm },
  closeBtn: { padding: spacing.sm },
  menu: { paddingVertical: spacing.sm, flex: 1 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemPressed: { backgroundColor: colors.gray50 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.black },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    padding: spacing.md,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  logoutLabel: { fontSize: 16, fontWeight: '600', color: colors.danger },
})
