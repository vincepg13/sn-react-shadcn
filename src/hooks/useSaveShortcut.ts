import { useEffect, useRef, RefObject } from 'react'

type SaveTrigger =
  | { buttonRef: RefObject<HTMLButtonElement | null>; onTrigger?: never }
  | { buttonRef?: never; onTrigger: () => void }

export type UseSaveShortcutOptions = SaveTrigger & {
  enabled?: boolean
  key?: string
}

// Capture current focus to be restored after
function captureFocusState() {
  const active = document.activeElement as
    | (HTMLElement & {
        selectionStart?: number | null
        selectionEnd?: number | null
        selectionDirection?: 'forward' | 'backward' | 'none'
      })
    | null

  if (!active) return null

  const isTextInput = active.tagName === 'INPUT' || active.tagName === 'TEXTAREA'

  if (isTextInput) {
    return {
      el: active,
      type: 'text' as const,
      start: active.selectionStart ?? 0,
      end: active.selectionEnd ?? 0,
      dir: active.selectionDirection ?? 'none',
    }
  }

  if (active.isContentEditable) {
    const sel = document.getSelection()
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null
    return { el: active, type: 'ce' as const, range }
  }

  return { el: active, type: 'other' as const }
}

// Restore focus and caret to previously focused element and position
function restoreFocusState(state: ReturnType<typeof captureFocusState>) {
  if (!state) return

  requestAnimationFrame(() => {
    if (state.type === 'text') {
      const el = state.el as HTMLInputElement | HTMLTextAreaElement
      el.focus?.({ preventScroll: true })
      try {
        el.setSelectionRange(state.start, state.end, state.dir)
      } catch {
        /* noop */
      }
    } else if (state.type === 'ce' && state.range) {
      state.el.focus?.({ preventScroll: true })
      const sel = document.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(state.range)
      }
    } else {
      state.el.focus?.({ preventScroll: true })
    }
  })
}

export function useSaveShortcut({ enabled = true, key = 's', ...trigger }: UseSaveShortcutOptions) {
  const triggerRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if ('buttonRef' in trigger && trigger.buttonRef?.current) {
      triggerRef.current = () => trigger.buttonRef?.current?.click()
    } else if ('onTrigger' in trigger) {
      triggerRef.current = trigger.onTrigger ?? null
    } else {
      triggerRef.current = null
    }
  }, [trigger])

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const handler = (e: KeyboardEvent) => {
      const isSaveShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key
      if (!isSaveShortcut) return

      e.preventDefault()

      const focusState = captureFocusState()
      ;(document.activeElement as HTMLElement | null)?.blur?.()

      requestAnimationFrame(() => {
        setTimeout(() => {
          triggerRef.current?.()
          restoreFocusState(focusState)
        }, 0)
      })
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled, key])
}
