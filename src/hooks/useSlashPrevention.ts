import React, { useCallback } from 'react'

/**
 * Returns an onKeyDown handler that:
 * - Detects Mod-/ (Ctrl-/ on Win/Linux, Cmd-/ on macOS)
 * - If the event has already been handled (`defaultPrevented`), it stops React + native propagation
 *   so document listeners (e.g., snUtils) never see it.
 */
export function useSlashPrevention() {
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const isModSlash = (e.ctrlKey || e.metaKey) && (e.code === 'Slash' || e.key === '/')

    if (isModSlash && e.defaultPrevented) {
      e.stopPropagation()
      const ne = e.nativeEvent as KeyboardEvent & { stopImmediatePropagation?: () => void }
      ne.stopPropagation()
      ne.stopImmediatePropagation?.()
    }
  }, [])

  return { onKeyDown }
}
