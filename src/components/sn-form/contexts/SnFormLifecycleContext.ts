import { createContext, useContext } from 'react'

export const SnFormLifecycleContext = createContext<{
  registerPreUiActionCallback: (fieldKey: string, cb: () => void | Promise<void>) => void
  registerPostUiActionCallback: (fieldKey: string, cb: () => void | Promise<void>) => void
} | null>(null)

export const useFormLifecycle = () => {
  const ctx = useContext(SnFormLifecycleContext)
  if (!ctx) throw new Error("useFormLifecycle must be used within SnForm")
  return ctx
}
