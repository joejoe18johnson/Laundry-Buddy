import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'

type Props = {
  count: number
  size?: 'sm' | 'md'
}

/** Red circle badge with white count — notifications and unread messages. */
export function UnreadCountBadge({ count, size = 'sm' }: Props) {
  const { colors } = useTheme()
  if (count <= 0) return null

  const isMd = size === 'md'
  const label = count > 9 ? '9+' : String(count)

  return (
    <View
      style={[
        styles.base,
        {
          minWidth: isMd ? 18 : 16,
          height: isMd ? 18 : 16,
          borderRadius: isMd ? 9 : 8,
          backgroundColor: colors.danger,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: isMd ? 10 : 9, color: colors.white }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  text: { fontWeight: '700' },
})
