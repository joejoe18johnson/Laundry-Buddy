import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  ALL_DROP_OFF_HOURS,
  formatDropOffHour,
  sortDropOffHours,
  type DropOffHour,
} from '../lib/dropOffAvailability'
import { colors, radius, spacing } from '../theme'

type BaseProps = {
  hours?: DropOffHour[]
}

type SelectProps = BaseProps & {
  mode: 'select'
  value: DropOffHour
  onChange: (hour: DropOffHour) => void
}

type ToggleProps = BaseProps & {
  mode: 'toggle'
  value: DropOffHour[]
  onChange: (hours: DropOffHour[]) => void
}

export function DropOffHourGrid(props: SelectProps | ToggleProps) {
  const hours = sortDropOffHours(props.hours ?? ALL_DROP_OFF_HOURS)

  const isSelected = (hour: DropOffHour) =>
    props.mode === 'select' ? props.value === hour : props.value.includes(hour)

  const handlePress = (hour: DropOffHour) => {
    if (props.mode === 'select') {
      props.onChange(hour)
      return
    }
    props.onChange(
      isSelected(hour)
        ? props.value.filter((h) => h !== hour).length > 0
          ? props.value.filter((h) => h !== hour)
          : props.value
        : sortDropOffHours([...props.value, hour]),
    )
  }

  return (
    <View style={styles.grid}>
      {hours.map((hour) => {
        const selected = isSelected(hour)
        return (
          <Pressable
            key={hour}
            onPress={() => handlePress(hour)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {formatDropOffHour(hour)}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray600,
  },
  chipTextSelected: {
    color: colors.white,
  },
})
