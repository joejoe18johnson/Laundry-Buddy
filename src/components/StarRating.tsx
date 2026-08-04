import { Ionicons } from '@expo/vector-icons'
import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'

type StarRatingProps = {
  rating: number
  size?: number
  filledColor?: string
  emptyColor?: string
  /** When false, rounds to nearest whole star for display. */
  interactive?: boolean
  onChange?: (rating: number) => void
}

export function StarRating({
  rating,
  size = 14,
  filledColor,
  emptyColor,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(), [])
  const filled = filledColor ?? colors.accent
  const empty = emptyColor ?? colors.gray200
  const displayRating = interactive ? rating : Math.max(0, Math.round(rating))

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayRating
        const icon = (
          <Ionicons
            name={isFilled ? 'star' : 'star-outline'}
            size={size}
            color={isFilled ? filled : empty}
          />
        )

        if (interactive && onChange) {
          return (
            <Pressable
              key={star}
              onPress={() => onChange(star)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${star} stars`}
            >
              {icon}
            </Pressable>
          )
        }

        return <View key={star}>{icon}</View>
      })}
    </View>
  )
}

function createStyles() {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  })
}
