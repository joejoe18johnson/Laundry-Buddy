import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ListRenderItem,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon, type IconName } from './AppIcon'
import { OutlineButton, PrimaryButton } from './ui'
import { useTheme } from '../context/ThemeContext'
import { brand, radius, spacing } from '../theme'
import { toTitleCase } from '../lib/titleCase'

const WINDOW_HEIGHT = Dimensions.get('window').height
const SLIDE_HEIGHT = Math.min(480, Math.round(WINDOW_HEIGHT * 0.46))
const ACTIONS_HEIGHT = 132

type TourStep = {
  id: string
  icon: IconName
  title: string
  body: string
  tips: string[]
}

export const HOST_BOOKING_WALKTHROUGH_STEPS: TourStep[] = [
  {
    id: 'overview',
    icon: 'layers',
    title: 'How hosting works',
    body: 'Every booking follows the same five steps in the app. Dashboard is for new requests; the Dryer tab is where you manage each load from payment through pickup.',
    tips: [
      'Follow every step in order — guests see the same progress',
      'One active load at a time keeps things simple',
    ],
  },
  {
    id: 'online',
    icon: 'bell',
    title: 'Step 1: Go online & accept',
    body: 'Turn on Online on your Dashboard when you are ready for guests. When a request arrives, review the details and tap Accept — the load moves to your Dryer tab.',
    tips: [
      'Decline quickly if you cannot take the load',
      'Accept only when you can finish all five steps',
    ],
  },
  {
    id: 'payment',
    icon: 'credit-card',
    title: 'Step 2: Confirm payment',
    body: 'On the Dryer tab, confirm payment before you start drying. Cash loads: tap when the guest pays at drop-off. Bank transfer: confirm after you verify their receipt in the app.',
    tips: [
      'Never start drying before payment is confirmed',
      'Bank details are sent to the guest automatically',
    ],
  },
  {
    id: 'drying',
    icon: 'wind',
    title: 'Step 3: Start drying',
    body: 'Once payment is confirmed, tap Start drying when the laundry is in the dryer. The guest is notified and can track progress in My loads.',
    tips: [
      'Update the stage in the app — do not skip this step',
      'Message the guest in-app if timing changes',
    ],
  },
  {
    id: 'ready',
    icon: 'package',
    title: 'Step 4: Mark dry',
    body: 'When the load is dry, tap Mark dry. You can add an optional photo so the guest knows it is ready. They receive a pickup notification right away.',
    tips: [
      'Accurate updates build trust and reviews',
      'Add a photo for larger or mixed loads',
    ],
  },
  {
    id: 'pickup',
    icon: 'check-circle',
    title: 'Step 5: Confirm pickup',
    body: 'When the guest collects their laundry, both of you confirm pickup in the app. The load is marked complete, reviews unlock, and your hosted count goes up.',
    tips: [
      'Both confirmations are required to close the load',
      'Completed loads improve your search ranking',
    ],
  },
  {
    id: 'essential',
    icon: 'shield',
    title: 'Stay in the app every time',
    body: 'Each step exists for a reason: clear expectations for guests, a record if anything goes wrong, and reputation that helps you get found. Off-platform shortcuts hurt your visibility.',
    tips: [
      'Record every sale — cash or transfer',
      'Reopen this guide anytime from Help',
    ],
  },
]

type Props = {
  visible: boolean
  onComplete: () => void
  onDismiss: () => void
}

export function HostBookingWalkthrough({ visible, onComplete, onDismiss }: Props) {
  const steps = HOST_BOOKING_WALKTHROUGH_STEPS
  const [index, setIndex] = useState(0)
  const [slideWidth, setSlideWidth] = useState(0)
  const listRef = useRef<FlatList<TourStep>>(null)
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  useEffect(() => {
    if (!visible) return
    setIndex(0)
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false })
    })
  }, [visible])

  const onListLayout = (event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width)
    if (width > 0 && width !== slideWidth) setSlideWidth(width)
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (slideWidth <= 0) return
    const next = Math.round(event.nativeEvent.contentOffset.x / slideWidth)
    if (next !== index && next >= 0 && next < steps.length) setIndex(next)
  }

  const scrollToStep = (stepIndex: number) => {
    if (slideWidth <= 0) return
    listRef.current?.scrollToOffset({ offset: slideWidth * stepIndex, animated: true })
  }

  const goNext = () => {
    if (index >= steps.length - 1) {
      onComplete()
      return
    }
    scrollToStep(index + 1)
  }

  const renderStep: ListRenderItem<TourStep> = ({ item }) => {
    const stepNumberById: Record<string, number> = {
      online: 1,
      payment: 2,
      drying: 3,
      ready: 4,
      pickup: 5,
    }
    const stepNumber = stepNumberById[item.id]
    const badgeLabel =
      stepNumber != null ? toTitleCase(`Step ${stepNumber} of 5`) : toTitleCase('Guide')

    return (
    <View style={[styles.slide, slideWidth > 0 && { width: slideWidth, height: SLIDE_HEIGHT }]}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{badgeLabel}</Text>
      </View>
      <View style={styles.iconWrap}>
        <AppIcon name={item.icon} size={28} color={colors.white} />
      </View>
      <Text style={styles.slideTitle}>{toTitleCase(item.title)}</Text>
      <Text style={styles.slideBody}>{toTitleCase(item.body)}</Text>
      <View style={styles.tips}>
        {item.tips.map((tip) => (
          <View key={tip} style={styles.tipRow}>
            <AppIcon name="check" size={14} color={colors.green} />
            <Text style={styles.tipText}>{toTitleCase(tip)}</Text>
          </View>
        ))}
      </View>
    </View>
    )
  }

  const isLast = index >= steps.length - 1

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>{toTitleCase('Host booking guide')}</Text>
              <Pressable onPress={onDismiss} hitSlop={8}>
                <Text style={styles.skip}>{toTitleCase('Skip')}</Text>
              </Pressable>
            </View>

            <View style={styles.listWrap} onLayout={onListLayout}>
              {slideWidth > 0 ? (
                <FlatList
                  ref={listRef}
                  data={steps}
                  keyExtractor={(item) => item.id}
                  renderItem={renderStep}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={onScroll}
                  scrollEventThrottle={16}
                  style={styles.list}
                  getItemLayout={(_, i) => ({ length: slideWidth, offset: slideWidth * i, index: i })}
                />
              ) : null}
            </View>

            <View style={styles.dots}>
              {steps.map((step, i) => (
                <View key={step.id} style={[styles.dot, i === index && styles.dotActive]} />
              ))}
            </View>

            <View style={styles.actions}>
              {isLast ? (
                <PrimaryButton title="Got it — open dashboard" icon="check-circle" full onPress={onComplete} />
              ) : (
                <>
                  <PrimaryButton title="Next" full onPress={goNext} />
                  <OutlineButton title="Skip guide" full onPress={onDismiss} />
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(36, 44, 52, 0.58)',
      justifyContent: 'center',
      paddingHorizontal: spacing.screen,
    },
    safe: { width: '100%', maxHeight: '94%' },
    card: {
      backgroundColor: colors.white,
      borderRadius: radius.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.gray500,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    skip: { fontSize: 14, fontWeight: '600', color: colors.gray500 },
    listWrap: { width: '100%', height: SLIDE_HEIGHT },
    list: { width: '100%', height: SLIDE_HEIGHT },
    slide: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
      height: SLIDE_HEIGHT,
    },
    stepBadge: {
      alignSelf: 'center',
      backgroundColor: colors.gray50,
      borderRadius: radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    stepBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.gray500,
      letterSpacing: 0.4,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: brand.ink,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: spacing.sm,
    },
    slideTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.black,
      textAlign: 'center',
      letterSpacing: -0.4,
      lineHeight: 30,
      marginBottom: spacing.sm,
    },
    slideBody: {
      fontSize: 15,
      color: colors.gray600,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.md,
    },
    tips: {
      flex: 1,
      gap: spacing.sm,
      backgroundColor: colors.gray50,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.gray100,
      justifyContent: 'center',
    },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    tipText: { flex: 1, fontSize: 14, color: colors.gray600, lineHeight: 20 },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.gray200,
    },
    dotActive: { backgroundColor: colors.black, width: 18 },
    actions: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      minHeight: ACTIONS_HEIGHT,
      justifyContent: 'flex-start',
    },
  })
}
