import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { colors, radius, spacing } from '../theme'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function HostSearchBar({
  value,
  onChange,
  placeholder = 'Search area or host…',
}: Props) {
  return (
    <View style={styles.wrap}>
      <AppIcon name="search" size={18} color={colors.gray500} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.gray400}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChange('')}
          hitSlop={8}
          accessibilityLabel="Clear search"
        >
          <AppIcon name="x" size={18} color={colors.gray500} />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.black,
    padding: 0,
  },
})
