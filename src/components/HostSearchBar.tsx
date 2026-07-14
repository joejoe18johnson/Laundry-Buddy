import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { AppIcon } from './AppIcon'
import { colors, radius, spacing } from '../theme'

type Props = {
  value: string
  onChange: (value: string) => void
  onLocate?: () => void
  locating?: boolean
  placeholder?: string
}

export function HostSearchBar({
  value,
  onChange,
  onLocate,
  locating = false,
  placeholder = 'Search area or host near you',
}: Props) {
  return (
    <View style={styles.wrap}>
      <AppIcon name="search" size={20} color={colors.gray500} />
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
      {value.length > 0 ? (
        <Pressable onPress={() => onChange('')} hitSlop={8} accessibilityLabel="Clear search">
          <AppIcon name="x-circle" size={18} color={colors.gray400} />
        </Pressable>
      ) : onLocate ? (
        <Pressable
          onPress={onLocate}
          hitSlop={8}
          disabled={locating}
          accessibilityLabel="Use my location"
          style={styles.locateBtn}
        >
          {locating ? (
            <ActivityIndicator size="small" color={colors.black} />
          ) : (
            <AppIcon name="navigation" size={18} color={colors.black} />
          )}
        </Pressable>
      ) : (
        <AppIcon name="navigation" size={18} color={colors.gray400} />
      )}
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
  locateBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
