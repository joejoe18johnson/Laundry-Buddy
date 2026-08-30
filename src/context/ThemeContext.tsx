import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useColorScheme } from 'react-native'
import { createUiStyles } from '../components/uiStyles'
import { loadThemePreference, saveThemePreference } from '../lib/themePreferences'
import {
  getFormStyles,
  getThemeColors,
  type ColorScheme,
  type FormStyles,
  type ThemeColors,
  type ThemePreference,
} from '../theme'

type ThemeContextValue = {
  colors: ThemeColors
  formStyles: FormStyles
  uiStyles: ReturnType<typeof createUiStyles>
  /** Resolved palette in use right now. */
  colorScheme: ColorScheme
  /** Saved user choice — may differ from `colorScheme` when set to `system`. */
  themePreference: ThemePreference
  setThemePreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: ColorScheme | null | undefined,
): ColorScheme {
  if (preference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light'
  }
  return preference
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system')

  useEffect(() => {
    void loadThemePreference().then((stored) => {
      if (stored) setThemePreferenceState(stored)
    })
  }, [])

  const colorScheme = resolveColorScheme(themePreference, systemScheme)

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference)
    void saveThemePreference(preference)
  }, [])

  const value = useMemo(() => {
    const colors = getThemeColors(colorScheme)
    const formStyles = getFormStyles(colors)
    return {
      colors,
      formStyles,
      uiStyles: createUiStyles(colors, formStyles),
      colorScheme,
      themePreference,
      setThemePreference,
    }
  }, [colorScheme, themePreference, setThemePreference])

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(value.colors.white)
  }, [value.colors.white])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

/** Status bar icons that contrast with the active screen background. */
export function ThemedStatusBar() {
  const { colorScheme } = useTheme()
  return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
}
