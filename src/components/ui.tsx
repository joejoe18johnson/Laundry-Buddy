import { ReactNode, type ComponentProps } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  type TextInputProps,
  View,
  ViewStyle,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon, type IconName } from './AppIcon'
import { SplashWasherAnimation } from './SplashWasherAnimation'
import { bottomSafePadding } from '../lib/safeAreaInsets'
import { colors, formStyles, radius, spacing } from '../theme'

export function AppTextInput({ style, multiline, placeholderTextColor, ...props }: TextInputProps) {
  return (
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor={placeholderTextColor ?? formStyles.placeholderColor}
      style={[styles.appInput, multiline && styles.appInputMultiline, style]}
    />
  )
}

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const insets = useSafeAreaInsets()
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: bottomSafePadding(insets.bottom, spacing.lg) },
            style,
          ]}
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
        styles.btnOutline,
        full && styles.btnFull,
        disabled && styles.btnOutlineDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      <View style={styles.btnContent}>
        {icon && (
          <AppIcon name={icon} size={18} color={disabled ? colors.gray400 : colors.black} />
        )}
        <Text style={[styles.btnOutlineText, disabled && styles.btnOutlineTextDisabled]}>{title}</Text>
      </View>
    </Pressable>
  )
}

export function SaveFooter({
  dirty,
  onSave,
  saving = false,
  saveLabel = 'Save changes',
  savedLabel = 'All changes saved',
  dirtyHint = 'Tap save when you are done',
}: {
  dirty: boolean
  onSave: () => void
  saving?: boolean
  saveLabel?: string
  savedLabel?: string
  dirtyHint?: string
}) {
  return (
    <View style={styles.saveFooter}>
      {dirty ? (
        <Text style={styles.saveFooterHint}>{dirtyHint}</Text>
      ) : (
        <View style={styles.saveFooterSavedRow}>
          <AppIcon name="check" size={16} color={colors.green} />
          <Text style={styles.saveFooterSavedText}>{savedLabel}</Text>
        </View>
      )}
      <PrimaryButton
        title={dirty ? saveLabel : 'Saved'}
        onPress={onSave}
        disabled={!dirty || saving}
        full
        icon={dirty ? undefined : 'check'}
      />
    </View>
  )
}

export function StickySaveBar({
  dirtyLabel = 'You have unsaved changes',
  saveLabel = 'Save now',
  onSave,
  saving = false,
}: {
  dirtyLabel?: string
  saveLabel?: string
  onSave: () => void
  saving?: boolean
}) {
  return (
    <View style={styles.stickySaveBar}>
      <Text style={styles.stickySaveText}>{dirtyLabel}</Text>
      <PrimaryButton title={saveLabel} onPress={onSave} disabled={saving} />
    </View>
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
      <SplashWasherAnimation />
    </View>
  )
}

export type StatusBadgeVariant =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'paid'
  | 'awaiting'
  | 'drying'
  | 'ready'
  | 'neutral'

export function StatusBadge({
  label,
  variant = 'neutral',
}: {
  label: string
  variant?: StatusBadgeVariant
}) {
  const badgeStyles: Record<StatusBadgeVariant, { bg: object; text: object }> = {
    pending: { bg: styles.status_pending, text: styles.statusText_pending },
    accepted: { bg: styles.status_accepted, text: styles.statusText_accepted },
    declined: { bg: styles.status_declined, text: styles.statusText_declined },
    paid: { bg: styles.status_paid, text: styles.statusText_paid },
    awaiting: { bg: styles.status_awaiting, text: styles.statusText_awaiting },
    drying: { bg: styles.status_drying, text: styles.statusText_drying },
    ready: { bg: styles.status_ready, text: styles.statusText_ready },
    neutral: { bg: styles.status_neutral, text: styles.statusText_neutral },
  }
  const v = badgeStyles[variant]
  return (
    <View style={[styles.statusBadge, v.bg]}>
      <Text style={[styles.statusBadgeText, v.text]}>{label}</Text>
    </View>
  )
}

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[]
  current: number
}) {
  return (
    <View style={styles.stepRow}>
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <View key={step} style={styles.stepItem}>
            <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
              {done ? <AppIcon name="check" size={10} color={colors.white} /> : null}
            </View>
            <Text style={[styles.stepLabel, (done || active) && styles.stepLabelActive]} numberOfLines={1}>
              {step}
            </Text>
            {i < steps.length - 1 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  scroll: {
    padding: spacing.screen,
    paddingTop: spacing.xl,
  },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  backText: { fontSize: 15, fontWeight: '500', color: colors.black, textTransform: 'capitalize' },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  btnPrimary: {
    backgroundColor: colors.black,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  btnPrimaryText: { color: colors.white, fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.black,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  btnOutlineText: { color: colors.black, fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  btnOutlineDisabled: { borderColor: colors.gray200, backgroundColor: colors.gray50 },
  btnOutlineTextDisabled: { color: colors.gray400 },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  btnGhostText: { color: colors.gray600, fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
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
  saveFooter: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  saveFooterHint: {
    fontSize: 13,
    color: colors.gray500,
    lineHeight: 18,
    textAlign: 'center',
  },
  saveFooterSavedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveFooterSavedText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.green,
  },
  stickySaveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  stickySaveText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.gray600 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'capitalize' },
  status_pending: { backgroundColor: colors.gray50, borderColor: colors.gray200 },
  statusText_pending: { color: colors.gray600 },
  status_accepted: { backgroundColor: colors.greenBg, borderColor: 'rgba(5,148,79,0.25)' },
  statusText_accepted: { color: colors.green },
  status_declined: { backgroundColor: '#fff5f5', borderColor: 'rgba(193,53,21,0.2)' },
  statusText_declined: { color: colors.danger },
  status_paid: { backgroundColor: colors.greenBg, borderColor: 'rgba(5,148,79,0.25)' },
  statusText_paid: { color: colors.green },
  status_awaiting: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  statusText_awaiting: { color: '#b45309' },
  status_drying: { backgroundColor: colors.gray50, borderColor: colors.black },
  statusText_drying: { color: colors.black },
  status_ready: { backgroundColor: colors.black, borderColor: colors.black },
  statusText_ready: { color: colors.white },
  status_neutral: { backgroundColor: colors.gray50, borderColor: colors.gray100 },
  statusText_neutral: { color: colors.gray600 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg, gap: 2 },
  stepItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginBottom: 6,
  },
  stepDotDone: { backgroundColor: colors.black, borderColor: colors.black },
  stepDotActive: { borderColor: colors.black, borderWidth: 2.5 },
  stepLabel: { fontSize: 10, fontWeight: '600', color: colors.gray400, textAlign: 'center' },
  stepLabelActive: { color: colors.black },
  stepLine: {
    position: 'absolute',
    top: 10,
    left: '55%',
    right: '-45%',
    height: 2,
    backgroundColor: colors.gray200,
    zIndex: -1,
  },
  stepLineDone: { backgroundColor: colors.black },
  appInput: { ...formStyles.input },
  appInputMultiline: { ...formStyles.inputMultiline },
})
