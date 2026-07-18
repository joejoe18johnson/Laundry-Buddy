import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { createUiStyles } from '../components/uiStyles'
import { getFormStyles, getThemeColors, type FormStyles, type ThemeColors } from '../theme'

type ThemeContextValue = {
  colors: ThemeColors
  formStyles: FormStyles
  uiStyles: ReturnType<typeof createUiStyles>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => {
    const colors = getThemeColors('light')
    const formStyles = getFormStyles(colors)
    return {
      colors,
      formStyles,
      uiStyles: createUiStyles(colors, formStyles),
    }
  }, [])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
