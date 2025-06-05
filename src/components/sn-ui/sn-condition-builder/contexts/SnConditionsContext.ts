import { SnConditionMap, SnDateTimeMeta } from '@kit/types/condition-schema'
import { createContext, Dispatch, SetStateAction, useContext } from 'react'

type SnCondMeta = {
  table: string
  fieldsByTable: Record<string, SnConditionMap>
  setFieldsByTable: Dispatch<SetStateAction<Record<string, SnConditionMap>>>
  dateMeta: SnDateTimeMeta | null
  setDateMeta: Dispatch<SetStateAction<SnDateTimeMeta | null>>
}

export const SnConditionsContext = createContext<SnCondMeta | null>(null)

export function useCondMeta(): SnCondMeta {
  const context = useContext(SnConditionsContext)
  if (!context) throw new Error('useCondMeta must be used within SnConditionsContext.Provider')
  return context
}