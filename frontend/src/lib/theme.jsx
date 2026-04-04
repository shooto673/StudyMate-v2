import { useState, useEffect, useCallback, createContext, useContext } from 'react'

const ThemeContext = createContext(null)

const LIGHT = {
  bg: '#FFFDF7',
  card: '#fff',
  cardBorder: '#f1f1f1',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  divider: '#f3f4f6',
  inputBg: '#fff',
  inputBorder: '#e5e7eb',
  tabBg: '#f3f4f6',
  tabActive: '#fff',
  headerBg: undefined, // transparent
  primary: '#6C63FF',
  primaryLight: '#EDE9FF',
  accent: '#38BDF8',
  success: '#51CF66',
  danger: '#dc2626',
  shadow: 'rgba(0,0,0,0.04)',
}

const DARK = {
  bg: '#0f0f1a',
  card: '#1a1a2e',
  cardBorder: '#2a2a3e',
  text: '#e5e5ef',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  divider: '#2a2a3e',
  inputBg: '#1a1a2e',
  inputBorder: '#3a3a4e',
  tabBg: '#1a1a2e',
  tabActive: '#2a2a3e',
  headerBg: '#0f0f1a',
  primary: '#7C73FF',
  primaryLight: '#2a2a4e',
  accent: '#38BDF8',
  success: '#51CF66',
  danger: '#ef4444',
  shadow: 'rgba(0,0,0,0.2)',
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('sm_darkmode') === 'true')

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem('sm_darkmode', String(next))
      return next
    })
  }, [])

  const theme = isDark ? DARK : LIGHT

  // Apply dark mode class and background to body
  useEffect(() => {
    document.body.style.background = theme.bg
    if (isDark) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [isDark, theme.bg])

  return (
    <ThemeContext.Provider value={{ isDark, toggle, theme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) return { isDark: false, toggle: () => {}, theme: LIGHT }
  return ctx
}

export { LIGHT, DARK }
