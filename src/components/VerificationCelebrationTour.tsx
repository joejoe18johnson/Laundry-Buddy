import { useMemo, useRef, useState } from 'react'
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
  type ListRenderItem,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon, type IconName } from './AppIcon'
import { GhostButton, OutlineButton, PrimaryButton } from './ui'
import { useTheme } from '../context/ThemeContext'
import { brand, radius, spacing } from '../theme'
import { toTitleCase } from '../lib/titleCase'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_SIDE_INSET = spacing.screen * 2 + spacing.lg * 2
const SLIDE_WIDTH = SCREEN_WIDTH - CARD_SIDE_INSET

type TourRole = 'customer' | 'host'

type TourStep = {
  id: string
  icon: IconName
  title: string
  body: string
  tips: string[]
}

const GUEST_STEPS: TourStep[] = [
  {
    id: 'congrats',
    icon: 'check-circle',
    title: "You're verified!",
    body: 'Your ID and selfie are approved. You can now browse hosts and book drying near you.',
    tips: ['Booking and messaging are unlocked', 'Your verification stays on file — no repeat uploads'],
  },
  {
    id: 'map',
    icon: 'map-pin',
    title: 'Find dryers near you',
    body: 'Open Home to see hosts on the map. Search by area, sort by price or distance, and read reviews.',
    tips: ['Use Close to me for nearby hosts', 'Tap a pin or card to view rates and dry time'],
  },
  {
    id: 'book',
    icon: 'calendar',
    title: 'Book in three quick steps',
    body: 'Pick a drop-off hour, choose loads and payment, then send your request. Optional details can wait.',
    tips: ['Cash = pay when you drop off', 'Bank transfer = pay after the host accepts'],
  },
  {
    id: 'alerts',
    icon: 'bell',
    title: 'Stay in the loop',
    body: 'Turn on bell notifications so you know right away when a host accepts, declines, or marks your load ready.',
    tips: ['Tap the bell in the top bar anytime', 'Drop-off reminders arrive 30 minutes early'],
  },
]

const HOST_STEPS: TourStep[] = [
  {
    id: 'congrats',
    icon: 'check-circle',
    title: "You're verified!",
    body: 'Your ID, selfie, and address are approved. Hosting is unlocked — you can start accepting loads.',
    tips: ['You will not need to verify again', 'Guests only see your first name and last initial'],
  },
  {
    id: 'pricing',
    icon: 'dollar-sign',
    title: 'Set your prices',
    body: 'In Account, set a dry price per load and optional folding fee. Most hosts in Belize charge $3–$6 per load.',
    tips: ['Start competitive — you can raise rates after reviews', 'Free drying can help you get first bookings'],
  },
  {
    id: 'hours',
    icon: 'clock',
    title: 'Choose hours & go online',
    body: 'Set drop-off hours that fit your schedule, then toggle Online when you are ready to accept laundry.',
    tips: ['Offline hides you from guest search', 'Add setup photos so guests trust your space'],
  },
  {
    id: 'promote',
    icon: 'users',
    title: 'Get discovered',
    body: 'Respond quickly to requests, keep slots open, and ask happy guests for reviews — top hosts show up first.',
    tips: ['Accept cash or bank transfer in settings', 'Message guests before drop-off if anything changes'],
  },
]

type Props = {
  visible: boolean
  role: TourRole
  onComplete: () => void
  onDismiss: () => void
}

export function VerificationCelebrationTour({ visible, role, onComplete, onDismiss }: Props) {
  const steps = role === 'host' ? HOST_STEPS : GUEST_STEPS
  const [index, setIndex] = useState(0)
  const listRef = useRef<FlatList<TourStep>>(null)
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH)
    if (next !== index) setIndex(next)
  }

  const goNext = () => {
    if (index >= steps.length - 1) {
      onComplete()
      return
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true })
  }

  const renderStep: ListRenderItem<TourStep> = ({ item }) => (
    <View style={[styles.slide, { width: SLIDE_WIDTH }]}>
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

  const isLast = index >= steps.length - 1
  const completeLabel = role === 'host' ? 'Set up my listing' : 'Explore dryers'

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>{toTitleCase('Welcome tour')}</Text>
              <Pressable onPress={onDismiss} hitSlop={8}>
                <Text style={styles.skip}>{toTitleCase('Skip')}</Text>
              </Pressable>
            </View>

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
              getItemLayout={(_, i) => ({ length: SLIDE_WIDTH, offset: SLIDE_WIDTH * i, index: i })}
            />

            <View style={styles.dots}>
              {steps.map((step, i) => (
                <View key={step.id} style={[styles.dot, i === index && styles.dotActive]} />
              ))}
            </View>

            <View style={styles.actions}>
              {isLast ? (
                <PrimaryButton title={completeLabel} icon={role === 'host' ? 'settings' : 'search'} full onPress={onComplete} />
              ) : (
                <PrimaryButton title="Next" icon="chevron-right" full onPress={goNext} />
              )}
              {!isLast ? <OutlineButton title="Skip tour" full onPress={onDismiss} /> : null}
              {index > 0 && !isLast ? (
                <GhostButton
                  title="Back"
                  onPress={() => listRef.current?.scrollToIndex({ index: index - 1, animated: true })}
                />
              ) : null}
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
    safe: { width: '100%' },
    card: {
      backgroundColor: colors.white,
      borderRadius: radius.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.gray100,
      maxHeight: '92%',
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
    list: { flexGrow: 0 },
    slide: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.md,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: brand.ink,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    slideTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.black,
      textAlign: 'center',
      letterSpacing: -0.4,
      lineHeight: 30,
    },
    slideBody: {
      fontSize: 15,
      color: colors.gray600,
      textAlign: 'center',
      lineHeight: 22,
    },
    tips: {
      marginTop: spacing.sm,
      gap: spacing.sm,
      backgroundColor: colors.gray50,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    tipText: { flex: 1, fontSize: 14, color: colors.gray600, lineHeight: 20 },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
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
    },
  })
}
