import { ReactNode } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon, type IconName } from './AppIcon'
import { colors, radius, spacing } from '../theme'

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, style]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export function BackButton({ onPress, label = 'Back' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable onPress={onPress} style={styles.backBtn}>
      <AppIcon name="chevron-left" size={18} />
      <Text style={styles.backText}>{label}</Text>
    </Pressable>
  )
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  full,
  icon,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
  full?: boolean
  icon?: IconName
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btnPrimary,
        full && styles.btnFull,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      <View style={styles.btnContent}>
        {icon && <AppIcon name={icon} size={18} color={colors.white} />}
        <Text style={styles.btnPrimaryText}>{title}</Text>
      </View>
    </Pressable>
  )
}

export function OutlineButton({
  title,
  onPress,
  full,
  icon,
}: {
  title: string
  onPress: () => void
  full?: boolean
  icon?: IconName
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btnOutline, full && styles.btnFull, pressed && styles.btnPressed]}
    >
      <View style={styles.btnContent}>
        {icon && <AppIcon name={icon} size={18} />}
        <Text style={styles.btnOutlineText}>{title}</Text>
      </View>
    </Pressable>
  )
}

export function GhostButton({
  title,
  onPress,
  full,
}: {
  title: string
  onPress: () => void
  full?: boolean
}) {
  return (
    <Pressable onPress={onPress} style={[styles.btnGhost, full && styles.btnFull]}>
      <Text style={styles.btnGhostText}>{title}</Text>
    </Pressable>
  )
}

export function MethodTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string; icon?: IconName }[]
  onChange: (v: T) => void
}) {
  return (
    <View style={styles.methodTabs}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={[styles.methodTab, value === opt.value && styles.methodTabActive]}
        >
          <View style={styles.methodTabContent}>
            {opt.icon && (
              <AppIcon
                name={opt.icon}
                size={16}
                color={value === opt.value ? colors.black : colors.gray500}
              />
            )}
            <Text style={[styles.methodTabText, value === opt.value && styles.methodTabTextActive]}>
              {opt.label}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  )
}

export function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  scroll: {
    padding: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  backText: { fontSize: 15, fontWeight: '500', color: colors.black },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  btnPrimary: {
    backgroundColor: colors.black,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  btnPrimaryText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.black,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  btnOutlineText: { color: colors.black, fontSize: 16, fontWeight: '600' },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingVertical: 16,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  btnGhostText: { color: colors.gray600, fontSize: 16, fontWeight: '600' },
  btnFull: { width: '100%' },
  btnDisabled: { opacity: 0.4 },
  btnPressed: { opacity: 0.85 },
  methodTabs: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.gray100,
    marginBottom: spacing.xl,
  },
  methodTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.pill },
  methodTabContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  methodTabActive: { backgroundColor: colors.white },
  methodTabText: { fontSize: 14, fontWeight: '600', color: colors.gray500 },
  methodTabTextActive: { color: colors.black },
})
