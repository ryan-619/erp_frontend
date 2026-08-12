// ====================================================================
// ThemeContext — Light/Dark/System Theme
//
// Purpose:
// Manages the app's color theme and persists the user's choice so the
// preference survives page refreshes.
//
// State stored:
//   - theme: 'light' | 'dark' | 'system' (default 'system')
//   - isDark: boolean derived from the resolved theme
//
// Consumed by:
//   - ThemeToggle (settings page + navbar)
//   - Chart components (BarChartCard, DonutChart, TrendAreaChart) to pick
//     grid/axis colors that remain legible in dark mode
//
// Implementation notes:
//   Toggling the `dark` class on <html> drives Tailwind's dark: variants.
//   When theme is 'system' we listen to matchMedia so the UI reacts live
//   to OS-level theme changes.
// ====================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '@/constants/navigation'

const ThemeContext = createContext(null)

// Applies the resolved theme by toggling the `dark` class on <html>.
// 'system' resolves against the OS preference via matchMedia.
const applyTheme = (theme) => {
  const root = document.documentElement
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', isDark)
}

export function ThemeProvider({ children }) {
  // Initialize from localStorage so a refresh preserves the saved theme.
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(STORAGE_KEYS.THEME) || 'system',
  )

  // Persist + apply whenever theme changes.
  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEYS.THEME, theme)
  }, [theme])

  // When in 'system' mode, react to the OS color-scheme changing without a page reload.
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((next) => setThemeState(next), [])

  const value = useMemo(
    () => ({ theme, setTheme, isDark: document.documentElement.classList.contains('dark') }),
    [theme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export default ThemeContext
