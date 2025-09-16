import { useState, useCallback, useEffect } from 'react'

export function useFullScreen() {
  // Maximise within current browser window
  const [isMaximized, setIsMaximized] = useState(false)
  const toggleMax = useCallback(() => setIsMaximized(v => !v), [])

  // Lock page scroll while maximized
  useEffect(() => {
    const prev = document.body.style.overflow
    if (isMaximized) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMaximized])

  // ESC to exit maximize
  useEffect(() => {
    if (!isMaximized) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMaximized(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMaximized])

  // Ctrl + M to toggle maximize
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey
      if (isMod && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault()
        toggleMax()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleMax])

  return { isMaximized, toggleMax }
}
