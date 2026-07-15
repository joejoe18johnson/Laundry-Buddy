import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { colors, radius, spacing } from '../theme'

type Props = {
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  placeholder?: string
  autoFocus?: boolean
  editable?: boolean
}

export function HostSearchBar({
  value,
  onChange,
  onFocus,
  placeholder = 'Search area or host near you',
  autoFocus = false,
  editable = true,
}: Props) {
  return (
    <View style={styles.wrap}>
      <AppIcon name="search" size={20} color={colors.gray500} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor={colors.gray400}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
        autoFocus={autoFocus}
        editable={editable}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChange('')} hitSlop={8} accessibilityLabel="Clear search">
          <AppIcon name="x-circle" size={18} color={colors.gray400} />
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
    padding: 0,
  },
})
