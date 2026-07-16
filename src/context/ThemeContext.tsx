import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createUiStyles } from '../components/uiStyles'
import { loadColorScheme, saveColorScheme } from '../lib/themeStorage'
import {
  getFormStyles,
  getThemeColors,
  type ColorScheme,
  type FormStyles,
  type ThemeColors,
} from '../theme'

type ThemeContextValue = {
  colorScheme: ColorScheme
  colors: ThemeColors
  formStyles: FormStyles
  uiStyles: ReturnType<typeof createUiStyles>
  setColorScheme: (scheme: ColorScheme) => void
  toggleColorScheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('light')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void loadColorScheme().then((stored) => {
      if (stored) setColorSchemeState(stored)
      setReady(true)
    })
  }, [])

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme)
    void saveColorScheme(scheme)
  }

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'light' ? 'dark' : 'light')
  }

  const value = useMemo(() => {
    const colors = getThemeColors(colorScheme)
    const formStyles = getFormStyles(colors)
    return {
      colorScheme,
      colors,
      formStyles,
      uiStyles: createUiStyles(colors, formStyles),
      setColorScheme,
      toggleColorScheme,
      isDark: colorScheme === 'dark',
    }
  }, [colorScheme])

  if (!ready) {
    const colors = getThemeColors('light')
    const formStyles = getFormStyles(colors)
    return (
      <ThemeContext.Provider
        value={{
          colorScheme: 'light',
          colors,
          formStyles,
          uiStyles: createUiStyles(colors, formStyles),
          setColorScheme,
          toggleColorScheme,
          isDark: false,
        }}
      >
        {children}
      </ThemeContext.Provider>
    )
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
