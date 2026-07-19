import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon } from './AppIcon'
import { useTheme } from '../context/ThemeContext'
import { spacing } from '../theme'

type Props = {
  visible: boolean
  aboveBottomNav?: boolean
  onPress: () => void
}

const BOTTOM_NAV_HEIGHT = 56

export function SupportChatFab({ visible, aboveBottomNav = true, onPress }: Props) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (!visible) return null

  const bottomOffset =
    insets.bottom + spacing.md + (aboveBottomNav ? BOTTOM_NAV_HEIGHT : 0)

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <Pressable
        onPress={onPress}
        style={[styles.fab, { bottom: bottomOffset }]}
        accessibilityRole="button"
        accessibilityLabel="Message support"
      >
        <AppIcon name="life-buoy" size={22} color={colors.white} />
      </Pressable>
    </View>
  )
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    wrap: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 20,
    },
    fab: {
      position: 'absolute',
      right: spacing.screen,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.black,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.black,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
  })
}
