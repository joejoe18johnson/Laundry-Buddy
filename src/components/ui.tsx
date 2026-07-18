import { createContext, ReactNode, useContext, useEffect, useRef, useState, type ComponentProps } from 'react'
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
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
import { toTitleCase } from '../lib/titleCase'
import { useTheme } from '../context/ThemeContext'
import { radius, spacing } from '../theme'

type ScreenScrollContextValue = {
  scrollToEnd: () => void
}

const ScreenScrollContext = createContext<ScreenScrollContextValue | null>(null)

export function useScreenScroll() {
  return useContext(ScreenScrollContext)
}

export function AppTextInput({ style, multiline, placeholderTextColor, placeholder, ...props }: TextInputProps) {
  const { uiStyles: styles, formStyles } = useTheme()
  const resolvedPlaceholder =
    typeof placeholder === 'string' ? toTitleCase(placeholder) : placeholder
  return (
    <TextInput
      {...props}
      placeholder={resolvedPlaceholder}
      multiline={multiline}
      placeholderTextColor={placeholderTextColor ?? formStyles.placeholderColor}
      style={[styles.appInput, multiline && styles.appInputMultiline, style]}
    />
  )
}

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const insets = useSafeAreaInsets()
  const { uiStyles: styles } = useTheme()
  const scrollRef = useRef<ScrollView>(null)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height)
    })
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0)
    })
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    })
  }

  const keyboardPadding = keyboardHeight

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenScrollContext.Provider value={{ scrollToEnd }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingBottom: bottomSafePadding(insets.bottom, spacing.lg) + keyboardPadding,
            },
            style,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </ScreenScrollContext.Provider>
    </SafeAreaView>
  )
}

export function BackButton({ onPress, label = 'Back' }: { onPress: () => void; label?: string }) {
  const { uiStyles: styles } = useTheme()
  return (
    <Pressable onPress={onPress} style={styles.backBtn}>
      <AppIcon name="chevron-left" size={18} />
      <Text style={styles.backText}>{toTitleCase(label)}</Text>
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
  const { uiStyles: styles, colors } = useTheme()
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
        <Text style={styles.btnPrimaryText}>{toTitleCase(title)}</Text>
      </View>
    </Pressable>
  )
}

export function SuccessButton({
  title,
  onPress,
  disabled,
  full,
  icon,
}: {
  title: string
  onPress?: () => void
  disabled?: boolean
  full?: boolean
  icon?: IconName
}) {
  const { uiStyles: styles } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled ?? !onPress}
      style={({ pressed }) => [
        styles.btnSuccess,
        full && styles.btnFull,
        (disabled ?? !onPress) && styles.btnDisabled,
        pressed && !(disabled ?? !onPress) && styles.btnPressed,
      ]}
    >
      <View style={styles.btnContent}>
        {icon && <AppIcon name={icon} size={18} color="#fff" />}
        <Text style={styles.btnSuccessText}>{toTitleCase(title)}</Text>
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
  const { uiStyles: styles, colors } = useTheme()
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
        <Text style={[styles.btnOutlineText, disabled && styles.btnOutlineTextDisabled]}>
          {toTitleCase(title)}
        </Text>
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
  const { uiStyles: styles, colors } = useTheme()
  return (
    <View style={styles.saveFooter}>
      {dirty ? (
        <Text style={styles.saveFooterHint}>{toTitleCase(dirtyHint)}</Text>
      ) : (
        <View style={styles.saveFooterSavedRow}>
          <AppIcon name="check" size={16} color={colors.green} />
          <Text style={styles.saveFooterSavedText}>{toTitleCase(savedLabel)}</Text>
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
  const { uiStyles: styles } = useTheme()
  return (
    <View style={styles.stickySaveBar}>
      <Text style={styles.stickySaveText}>{toTitleCase(dirtyLabel)}</Text>
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
  const { uiStyles: styles, colors } = useTheme()
  return (
    <Pressable onPress={onPress} style={[styles.btnGhost, full && styles.btnFull]}>
      <View style={styles.btnContent}>
        {icon && <AppIcon name={icon} size={18} color={colors.gray600} />}
        <Text style={styles.btnGhostText}>{toTitleCase(title)}</Text>
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
  const { uiStyles: styles, colors } = useTheme()
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
                {toTitleCase(opt.label)}
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
  const { uiStyles: styles, colors } = useTheme()
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
        {toTitleCase(label)}
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
  const { uiStyles: styles } = useTheme()
  return (
    <Pressable onPress={onPress} style={styles.optionRow}>
      <View style={[styles.optionRadio, selected && styles.optionRadioSelected]}>
        {selected ? <View style={styles.optionRadioDot} /> : null}
      </View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionLabel}>{toTitleCase(label)}</Text>
        {sub ? <Text style={styles.optionSub}>{toTitleCase(sub)}</Text> : null}
      </View>
    </Pressable>
  )
}

export function BrandSwitch({
  accent = 'black',
  style,
  ...props
}: { accent?: 'black' | 'green' } & ComponentProps<typeof Switch>) {
  const { uiStyles: styles, colors } = useTheme()
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
  const { uiStyles: styles } = useTheme()
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
  const { uiStyles: styles } = useTheme()
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
      <Text style={[styles.statusBadgeText, v.text]}>{toTitleCase(label)}</Text>
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
  const { uiStyles: styles, colors } = useTheme()
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
              {toTitleCase(step)}
            </Text>
            {i < steps.length - 1 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
          </View>
        )
      })}
    </View>
  )
}
