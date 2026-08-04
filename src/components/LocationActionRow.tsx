import { StyleSheet, View } from 'react-native'
import { CloseToMeButton } from './CloseToMeButton'
import { SearchRadiusButton } from './SearchRadiusButton'
import { spacing } from '../theme'

type Props = {
  onCloseToMe: () => void
  closeToMeLoading?: boolean
  radiusMiles: number
  onOpenRadius: () => void
}

export function LocationActionRow({
  onCloseToMe,
  closeToMeLoading,
  radiusMiles,
  onOpenRadius,
}: Props) {
  return (
    <View style={styles.row}>
      <CloseToMeButton onPress={onCloseToMe} loading={closeToMeLoading} />
      <SearchRadiusButton radiusMiles={radiusMiles} onPress={onOpenRadius} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
})
