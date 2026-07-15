import { useRef, useState } from 'react'
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from '../../components/AppIcon'
import { IntroArtEarn } from '../../components/intro/IntroArtEarn'
import { IntroArtEasy } from '../../components/intro/IntroArtEasy'
import { IntroArtRain } from '../../components/intro/IntroArtRain'
import { GhostButton, PrimaryButton } from '../../components/ui'
import { colors, radius, spacing } from '../../theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface Slide {
  id: string
  eyebrow: string
  title: string
  body: string
  highlight?: string
  Art: typeof IntroArtEasy
}

const SLIDES: Slide[] = [
  {
    id: 'easy',
    eyebrow: 'Simple & Convenient',
    title: 'Book a Dryer in Minutes',
    body: 'See Nearby Hosts on the Map, Pick a Drop-Off Hour, and Confirm — No Phone Tag, No Guesswork. Laundry Sorted Before Your Coffee Cools.',
    highlight: '3 Taps to Book',
    Art: IntroArtEasy,
  },
  {
    id: 'rain',
    eyebrow: 'Any Weather',
    title: 'Rainy Day? Still Dry.',
    body: 'When Hanging Laundry Isn’t an Option, Drop Your Wet Load With a Neighbor Who Has a Dryer. You Stay Inside — They Handle the Tumble.',
    highlight: 'Dry Even When It Pours',
    Art: IntroArtRain,
  },
  {
    id: 'earn',
    eyebrow: 'Extra Income',
    title: 'Make Money From Your Dryer',
    body: 'Already Running Loads at Home? List Your Machine, Set Your Hours and Price, and Earn Per Load Between Chores — Cash or Bank Transfer.',
    highlight: 'Side Income on Your Schedule',
    Art: IntroArtEarn,
  },
]

interface Props {
  onComplete: () => void
}

export function IntroOnboardingScreen({ onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const listRef = useRef<FlatList<Slide>>(null)

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    if (i !== index) setIndex(i)
  }

  const goNext = () => {
    if (index >= SLIDES.length - 1) {
      onComplete()
      return
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true })
  }

  const renderSlide: ListRenderItem<Slide> = ({ item }) => {
    const Art = item.Art
    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View style={styles.eyebrowPill}>
          <Text style={styles.eyebrowText}>{item.eyebrow}</Text>
        </View>
        <View style={styles.artWrap}>
          <Art size={252} />
        </View>
        {item.highlight ? (
          <View style={styles.highlightRow}>
            <AppIcon name="check-circle" size={14} color={colors.green} />
            <Text style={styles.highlightText}>{item.highlight}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    )
  }

  const isLast = index === SLIDES.length - 1

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <AppIcon name="wind" size={16} color={colors.white} />
          </View>
          <Text style={styles.brand}>Laundry Buddy</Text>
        </View>
        {!isLast && (
          <Pressable onPress={onComplete} hitSlop={12}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View key={slide.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        {isLast ? (
          <View style={styles.ctaBlock}>
            <PrimaryButton title="Get Started" icon="arrow-right" onPress={onComplete} full />
            <Text style={styles.ctaSub}>Find a Host or List Your Dryer — Same App.</Text>
          </View>
        ) : (
          <GhostButton title="Next" icon="arrow-right" onPress={goNext} full />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  skip: { fontSize: 15, fontWeight: '600', color: colors.gray500 },
  slide: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  eyebrowPill: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: spacing.lg,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray600,
    textTransform: 'capitalize',
    letterSpacing: 0.6,
  },
  artWrap: {
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  highlightText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.green,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: spacing.md,
    color: colors.black,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: colors.gray500,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray200,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.black,
  },
  ctaBlock: { gap: spacing.sm },
  ctaSub: {
    fontSize: 13,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 18,
  },
})
