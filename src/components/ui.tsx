import { ReactNode, type ComponentProps } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
  icon,
}: {
  title: string
  onPress: () => void
  full?: boolean
  icon?: IconName
}) {
  return (
    <Pressable onPress={onPress} style={[styles.btnGhost, full && styles.btnFull]}>
      <View style={styles.btnContent}>
        {icon && <AppIcon name={icon} size={18} color={colors.gray600} />}
        <Text style={styles.btnGhostText}>{title}</Text>
      </View>
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
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.methodTab, active && styles.methodTabActive]}
          >
            <View style={styles.methodTabContent}>
              {opt.icon && (
                <AppIcon
                  name={opt.icon}
                  size={18}
                  color={active ? colors.white : colors.gray500}
                />
              )}
              <Text style={[styles.methodTabText, active && styles.methodTabTextActive]}>
                {opt.label}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

export function ChoiceChip({
  label,
  selected,
  onPress,
  icon,
  variant = 'filled',
  size = 'default',
}: {
  label: string
  selected: boolean
  onPress: () => void
  icon?: IconName
  variant?: 'filled' | 'outline'
  size?: 'default' | 'compact'
}) {
  const iconColor = selected
    ? variant === 'filled'
      ? colors.white
      : colors.black
    : colors.gray600
  const iconSize = size === 'compact' ? 13 : 16

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choiceChip,
        size === 'compact' && styles.choiceChipCompact,
        variant === 'outline' && styles.choiceChipOutline,
        selected && variant === 'filled' && styles.choiceChipFilled,
        selected && variant === 'outline' && styles.choiceChipOutlineSelected,
      ]}
    >
      {icon ? <AppIcon name={icon} size={iconSize} color={iconColor} /> : null}
      <Text
        style={[
          styles.choiceChipText,
          size === 'compact' && styles.choiceChipTextCompact,
          selected && variant === 'filled' && styles.choiceChipTextFilled,
          selected && variant === 'outline' && styles.choiceChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export function OptionRow({
  label,
  sub,
  selected,
  onPress,
}: {
  label: string
  sub?: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={styles.optionRow}>
      <View style={[styles.optionRadio, selected && styles.optionRadioSelected]}>
        {selected ? <View style={styles.optionRadioDot} /> : null}
      </View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionLabel}>{label}</Text>
        {sub ? <Text style={styles.optionSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  )
}

export function BrandSwitch({
  accent = 'black',
  style,
  ...props
}: { accent?: 'black' | 'green' } & ComponentProps<typeof Switch>) {
  const onColor = accent === 'green' ? colors.green : colors.black
  return (
    <Switch
      {...props}
      trackColor={{ false: colors.gray200, true: onColor }}
      thumbColor={colors.white}
      ios_backgroundColor={colors.gray200}
      style={[styles.brandSwitch, style]}
    />
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
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  btnPrimaryText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.black,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  btnOutlineText: { color: colors.black, fontSize: 16, fontWeight: '600' },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  btnGhostText: { color: colors.gray600, fontSize: 16, fontWeight: '600' },
  btnFull: { width: '100%' },
  btnDisabled: { opacity: 0.4 },
  btnPressed: { opacity: 0.85 },
  methodTabs: {
    flexDirection: 'row',
    backgroundColor: colors.gray75,
    borderRadius: radius.pill,
    padding: 5,
    minHeight: 56,
    marginBottom: spacing.xl,
  },
  methodTab: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  methodTabContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  methodTabActive: { backgroundColor: colors.black },
  methodTabText: { fontSize: 15, fontWeight: '600', color: colors.gray500 },
  methodTabTextActive: { color: colors.white },
  choiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.gray50,
  },
  choiceChipCompact: {
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 5,
  },
  choiceChipOutline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  choiceChipFilled: {
    backgroundColor: colors.black,
  },
  choiceChipOutlineSelected: {
    borderColor: colors.black,
    borderWidth: 1.5,
    backgroundColor: colors.white,
  },
  choiceChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray600,
  },
  choiceChipTextCompact: { fontSize: 13 },
  choiceChipTextFilled: { color: colors.white },
  choiceChipTextSelected: { color: colors.black },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  optionRadio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioSelected: { borderColor: colors.black },
  optionRadioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.black,
  },
  optionCopy: { flex: 1, gap: 2 },
  optionLabel: { fontSize: 16, fontWeight: '600', color: colors.black },
  optionSub: { fontSize: 14, color: colors.gray500, lineHeight: 20 },
  brandSwitch: {
    transform: [{ scaleX: 1.08 }, { scaleY: 1.08 }],
  },
})
