export const colors = {
  black: '#000000',
  white: '#ffffff',
  gray50: '#f6f6f6',
  gray75: '#eeeeee',
  gray100: '#e8e8e8',
  gray200: '#d1d1d1',
  gray400: '#a3a3a3',
  gray500: '#6b6b6b',
  gray600: '#424242',
  accent: '#000000',
  blue: '#276ef1',
  green: '#05944f',
  greenBg: '#ecfdf3',
  danger: '#c13515',
  mapBg: '#f2f2f2',
}

/** Shared brand marks — laundry basket icon (app icon, splash, loading). */
export const brand = {
  ink: '#242C34',
  green: '#1B833E',
  iconBg: '#000000',
} as const

export const coverColors: Record<string, [string, string]> = {
  maria: ['#1a1a1a', '#404040'],
  lopez: ['#2d2d2d', '#525252'],
  castillo: ['#333333', '#666666'],
  rupert: ['#262626', '#595959'],
  sandra: ['#3d3d3d', '#707070'],
  elena: ['#1f1f1f', '#4a4a4a'],
  marcus: ['#292929', '#5c5c5c'],
  carmen: ['#2a2a2a', '#555555'],
  pedro: ['#303030', '#5a5a5a'],
  lucia: ['#353535', '#606060'],
  miguel: ['#282828', '#525252'],
}

export const spacing = {
  screen: 24,
  sm: 10,
  md: 18,
  lg: 28,
  xl: 36,
  xxl: 56,
}

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  sheet: 28,
  pill: 999,
}

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, fontWeight: '400' as const, color: colors.gray500 },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const, color: colors.gray500 },
  label: { fontSize: 12, fontWeight: '600' as const, color: colors.gray500, letterSpacing: 0.2 },
  /** Title Case for UI labels and supporting copy */
  titleCase: { textTransform: 'capitalize' as const },
}

/** Shared form field styles — explicit colors for Android dark-mode safety. */
export const formStyles = {
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.sm,
    padding: 16,
    fontSize: 16,
    color: colors.black,
    backgroundColor: colors.white,
  },
  inputCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
    lineHeight: 22,
  },
  placeholderColor: colors.gray400,
}
