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
      <Text style={styles.backText}>← {label}</Text>
    </Pressable>
  )
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  full,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
  full?: boolean
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
      <Text style={styles.btnPrimaryText}>{title}</Text>
    </Pressable>
  )
}

export function OutlineButton({
  title,
  onPress,
  full,
}: {
  title: string
  onPress: () => void
  full?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btnOutline, full && styles.btnFull, pressed && styles.btnPressed]}
    >
      <Text style={styles.btnOutlineText}>{title}</Text>
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
  options: { value: T; label: string }[]
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
          <Text style={[styles.methodTabText, value === opt.value && styles.methodTabTextActive]}>
            {opt.label}
          </Text>
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
  scroll: { padding: spacing.screen, paddingBottom: 40 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { paddingVertical: 12 },
  backText: { fontSize: 15, fontWeight: '500', color: colors.black },
  btnPrimary: {
    backgroundColor: colors.black,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  btnPrimaryText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.black,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  btnOutlineText: { color: colors.black, fontSize: 16, fontWeight: '600' },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingVertical: 14,
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
    padding: 3,
    borderWidth: 1,
    borderColor: colors.gray100,
    marginBottom: spacing.lg,
  },
  methodTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.pill },
  methodTabActive: { backgroundColor: colors.white },
  methodTabText: { fontSize: 14, fontWeight: '600', color: colors.gray500 },
  methodTabTextActive: { color: colors.black },
})
