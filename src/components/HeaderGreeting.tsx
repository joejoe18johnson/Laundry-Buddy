import { Image, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { spacing } from '../theme'

const mascotSource = require('../../assets/lb-mascot.png')
const mascotAspect =
  Image.resolveAssetSource(mascotSource).width / Image.resolveAssetSource(mascotSource).height

type Props = {
  name: string
}

/** App shell title: brand mascot, divider, and "Hi {first name}". */
export function HeaderGreeting({ name }: Props) {
  const { colors } = useTheme()
  const mascotSize = 34
  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
      gap: spacing.sm,
    },
    mascot: {
      width: Math.round(mascotSize * mascotAspect),
      height: mascotSize,
      flexShrink: 0,
    },
    divider: {
      width: 1,
      height: 28,
      backgroundColor: colors.gray200,
      flexShrink: 0,
    },
    greeting: {
      flexShrink: 1,
      fontSize: 22,
      fontWeight: '700',
      color: colors.black,
      letterSpacing: -0.4,
    },
  })

  return (
    <View style={styles.row}>
      <Image
        source={mascotSource}
        style={styles.mascot}
        resizeMode="contain"
        accessibilityLabel="Laundry Buddy"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.divider} />
      <Text style={styles.greeting} numberOfLines={1}>
        Hi {name}
      </Text>
    </View>
  )
}
