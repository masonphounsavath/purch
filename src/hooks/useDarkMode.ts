import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('purch-mode') === 'dark'
  })

  useEffect(() => {
    const el = document.documentElement
    if (isDark) {
      el.setAttribute('data-mode', 'dark')
    } else {
      el.removeAttribute('data-mode')
    }
    localStorage.setItem('purch-mode', isDark ? 'dark' : 'light')
  }, [isDark])

  return { isDark, toggle: () => setIsDark(d => !d) }
}
