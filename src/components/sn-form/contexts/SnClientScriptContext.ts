/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext } from 'react'
import { FieldUIState, SnFormApis } from '@kit/types/form-schema'

interface ClientScriptContextValue {
  apis?: SnFormApis
  gForm: any
  fieldChangeHandlers: Record<string, (val: any) => void>
  fieldUIState: Record<string, FieldUIState>
  runClientScriptsForFieldChange: (fieldName: string, oldValue: any, newValue: any, isLoading?: boolean) => void
  runOnSubmitClientScripts: (action: string) => boolean | undefined
}

export const SnClientScriptContext = createContext<ClientScriptContextValue | null>(null)

export function useClientScripts() {
  const context = useContext(SnClientScriptContext)
  if (!context) throw new Error('useClientScripts must be used inside SnClientScriptProvider')
  return context
}
