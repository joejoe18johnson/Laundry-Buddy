export type ColorScheme = 'light' | 'dark'

export type ThemeColors = {
  black: string
  white: string
  gray50: string
  gray75: string
  gray100: string
  gray200: string
  gray400: string
  gray500: string
  gray600: string
  accent: string
  blue: string
  green: string
  greenBg: string
  danger: string
  mapBg: string
}

export const lightColors: ThemeColors = {
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

/** Inverted semantic tokens — `black` is primary text, `white` is screen background. */
export const darkColors: ThemeColors = {
  black: '#f2f2f2',
  white: '#121212',
  gray50: '#1a1a1a',
  gray75: '#222222',
  gray100: '#2c2c2c',
  gray200: '#3d3d3d',
  gray400: '#8a8a8a',
  gray500: '#a8a8a8',
  gray600: '#c8c8c8',
  accent: '#f2f2f2',
  blue: '#5b9cf5',
  green: '#34d399',
  greenBg: '#0f2a1f',
  danger: '#f87171',
  mapBg: '#1a1a1a',
}

/** @deprecated Use useTheme().colors — static light palette for legacy imports. */
export const colors = lightColors

export function getThemeColors(scheme: ColorScheme): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors
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

export type FormStyles = {
  input: {
    borderWidth: number
    borderColor: string
    borderRadius: number
    padding: number
    fontSize: number
    color: string
    backgroundColor: string
  }
  inputCompact: {
    paddingHorizontal: number
    paddingVertical: number
    fontSize: number
  }
  inputMultiline: {
    minHeight: number
    textAlignVertical: 'top'
    lineHeight: number
  }
  placeholderColor: string
}

export function getFormStyles(themeColors: ThemeColors): FormStyles {
  return {
    input: {
      borderWidth: 1,
      borderColor: themeColors.gray200,
      borderRadius: radius.sm,
      padding: 16,
      fontSize: 16,
      color: themeColors.black,
      backgroundColor: themeColors.white,
    },
    inputCompact: {
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: 15,
    },
    inputMultiline: {
      minHeight: 100,
      textAlignVertical: 'top',
      lineHeight: 22,
    },
    placeholderColor: themeColors.gray400,
  }
}

/** @deprecated Use useTheme().formStyles */
export const formStyles = getFormStyles(lightColors)

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

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, fontWeight: '400' as const, color: lightColors.gray500 },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const, color: lightColors.gray500 },
  label: { fontSize: 12, fontWeight: '600' as const, color: lightColors.gray500, letterSpacing: 0.2 },
}
