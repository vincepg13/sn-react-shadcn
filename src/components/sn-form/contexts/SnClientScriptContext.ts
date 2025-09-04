/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext } from 'react'
import { FieldUIState, SnFormApis } from '@kit/types/form-schema'

interface ClientScriptContextValue {
  fieldChangeHandlers: Record<string, (val: any) => void>
  runClientScriptsForFieldChange: (fieldName: string, oldValue: any, newValue: any, isLoading?: boolean) => void
  gForm: any
  fieldUIState: Record<string, FieldUIState>,
  apis?: SnFormApis
}

export const SnClientScriptContext = createContext<ClientScriptContextValue | null>(null)

export function useClientScripts() {
  const context = useContext(SnClientScriptContext)
  if (!context) throw new Error('useClientScripts must be used inside SnClientScriptProvider')
  return context
}
