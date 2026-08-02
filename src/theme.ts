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

/** Brand palette — Turquoise, Lime, Dark Navy, Off White. */
export const brandColors = {
  turquoise: '#00CBA9',
  lime: '#9BE15D',
  navy: '#1F2933',
  offWhite: '#FDFDFD',
} as const

export const lightColors: ThemeColors = {
  black: brandColors.navy,
  white: brandColors.offWhite,
  gray50: '#F4F6F8',
  gray75: '#E8ECF0',
  gray100: '#DDE3EA',
  gray200: '#C5CED8',
  gray400: '#8B9AAB',
  gray500: '#5C6B7A',
  gray600: '#3D4F5F',
  accent: brandColors.turquoise,
  blue: brandColors.turquoise,
  green: brandColors.lime,
  greenBg: '#EEF9E3',
  danger: '#c13515',
  mapBg: '#EEF2F5',
}

/** Inverted semantic tokens — `black` is primary text, `white` is screen background. */
export const darkColors: ThemeColors = {
  black: brandColors.offWhite,
  white: '#141C24',
  gray50: '#1A2430',
  gray75: '#222E3C',
  gray100: '#2A3848',
  gray200: '#3A4A5C',
  gray400: '#8B9AAB',
  gray500: '#A8B4C0',
  gray600: '#C8D0D8',
  accent: brandColors.turquoise,
  blue: brandColors.turquoise,
  green: brandColors.lime,
  greenBg: '#1A2E14',
  danger: '#f87171',
  mapBg: '#1A2430',
}

/** @deprecated Use useTheme().colors — static light palette for legacy imports. */
export const colors = lightColors

export function getThemeColors(scheme: ColorScheme): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors
}

export const spacing = {
  xs: 6,
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
  ink: brandColors.navy,
  green: brandColors.lime,
  iconBg: brandColors.turquoise,
} as const

export const coverColors: Record<string, [string, string]> = {
  maria: [brandColors.navy, '#007A68'],
  lopez: ['#1A3340', brandColors.turquoise],
  castillo: ['#243040', '#00A892'],
  rupert: [brandColors.navy, '#2A4050'],
  sandra: ['#1E2E3A', brandColors.turquoise],
  elena: ['#152028', '#008F78'],
  marcus: [brandColors.navy, '#3A5060'],
  carmen: ['#1C2834', brandColors.turquoise],
  pedro: ['#243038', '#00B89A'],
  lucia: [brandColors.navy, '#4A6070'],
  miguel: ['#1A2832', brandColors.turquoise],
}

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, fontWeight: '400' as const, color: lightColors.gray500 },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const, color: lightColors.gray500 },
  label: { fontSize: 12, fontWeight: '600' as const, color: lightColors.gray500, letterSpacing: 0.2 },
}
