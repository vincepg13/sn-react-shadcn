import { createContext, useContext } from 'react'
import { SnUiAction } from '@kit/types/form-schema'
import type { UiActionController } from '@kit/types/g-form'

type UiActionContextType = {
  handleUiAction: (action: SnUiAction) => Promise<void>
  uiActions: SnUiAction[]
  visibleUiActions: SnUiAction[]
  uiActionController: UiActionController
  isActionDisabled: (actionName: string) => boolean
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
