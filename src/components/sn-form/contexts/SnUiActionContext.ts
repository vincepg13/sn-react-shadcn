import { createContext, useContext } from 'react'
import { SnUiAction } from '@kit/types/form-schema'

type UiActionContextType = {
  handleUiAction: (action: SnUiAction) => Promise<void>
  uiActions: SnUiAction[]
  loadingActionId: string | null
}

export const SnUiActionContext = createContext<UiActionContextType | null>(null)

export function useUiActions() {
  const ctx = useContext(SnUiActionContext)
  if (!ctx) {
    throw new Error('useUiActions must be used within SnUiActionContext.Provider')
  }
  return ctx
}