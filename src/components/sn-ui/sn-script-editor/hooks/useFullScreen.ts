import { useState, useCallback, useEffect } from 'react'

export function useFullScreen() {
  const [isMaximized, setIsMaximized] = useState(false)
  const toggleMax = useCallback(() => {setIsMaximized(v => !v)}, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    if (isMaximized) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isMaximized])

  return { isMaximized, toggleMax }
}