import { useCallback, useEffect, useMemo, useState } from 'react'
import { SnFieldSchema, SnFieldsSchema } from '@kit/types/form-schema'
import { FieldUIState } from '../../../types/form-schema'

interface SingleFieldProps {
  field: SnFieldSchema
  fieldVal: string
  uiState: Record<string, FieldUIState>
}

interface MultiFieldProps {
  fields: { field: SnFieldSchema; fieldVal: string }[]
  uiState: Record<string, FieldUIState>
}

function computeEffectiveFieldState(
  field: SnFieldSchema,
  fieldVal: string,
  uiState: Record<string, FieldUIState>
): FieldUIState {
  function isReadonly(sysRo: boolean, ro: boolean, man: boolean): boolean {
    return sysRo ? true : ro && !!(fieldVal || !man)
  }

  function isMandatory(sysRo: boolean, man: boolean): boolean {
    return sysRo ? false : man
  }

  const overrides = uiState[field.name] || {}
  const ro = overrides.readonly ?? field.readonly ?? false
  const man = overrides.mandatory ?? field.mandatory ?? false

  return {
    readonly: isReadonly(!!field.sys_readonly, ro, man),
    visible: overrides.visible ?? field.visible ?? true,
    mandatory: isMandatory(!!field.sys_readonly, man),
  }
}

export function useEffectiveFieldState({ field, fieldVal, uiState }: SingleFieldProps): FieldUIState {
  return useMemo(() => computeEffectiveFieldState(field, fieldVal, uiState), [
    field,
    fieldVal,
    uiState,
  ])
}

export function useEffectiveFieldStates({ fields, uiState }: MultiFieldProps): Record<string, FieldUIState> {
  return useMemo(() => {
    const result: Record<string, FieldUIState> = {}
    for (const { field, fieldVal } of fields) {
      result[field.name] = computeEffectiveFieldState(field, fieldVal, uiState)
    }
    return result
  }, [fields, uiState])
}

export function useFieldUIStateManager(formFields: SnFieldsSchema) {
  const [fieldUIState, setFieldUIState] = useState<Record<string, FieldUIState>>({})

  const enforceJournalVisibility = useCallback(() => {
    const journalFields = Object.values(formFields).filter(f => f.type === 'journal_input')
    const anyMandatory = journalFields.some(f => {
      const override = fieldUIState[f.name]
      return override?.mandatory ?? f.mandatory
    })

    if (anyMandatory) {
      journalFields.forEach(f => {
        if (!fieldUIState[f.name]?.visible) {
          setFieldUIState(prev => ({
            ...prev,
            [f.name]: {
              ...prev[f.name],
              visible: true,
            },
          }))
        }
      })
    } else {
      journalFields.forEach(f => {
        if (fieldUIState[f.name]?.visible) {
          setFieldUIState(prev => ({
            ...prev,
            [f.name]: {
              ...prev[f.name],
              visible: f.visible ?? false,
            },
          }))
        }
      })
    }
  }, [formFields, fieldUIState])

  const updateFieldUI = useCallback((field: string, updates: Partial<FieldUIState>) => {
    setFieldUIState(prev => {
      const originalMandatory = prev[field]?.mandatory ?? formFields[field]?.mandatory
      const next = {
        ...prev,
        [field]: {
          ...prev[field],
          ...updates,
        },
      }

      if (
        formFields[field]?.type === 'journal_input' &&
        updates.mandatory !== undefined &&
        updates.mandatory !== originalMandatory
      ) {
        setTimeout(() => enforceJournalVisibility(), 0)
      }

      return next
    })
  }, [])

  useEffect(() => {
    enforceJournalVisibility()
  }, [formFields, enforceJournalVisibility])

  return {
    fieldUIState,
    updateFieldUI,
  }
}
