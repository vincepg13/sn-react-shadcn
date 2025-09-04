import { useCallback, useEffect, useMemo, useState } from 'react'
import { SnFieldSchema, SnFieldsSchema } from '@kit/types/form-schema'
import { FieldUIState } from '../../../types/form-schema'
import { computeEffectiveFieldState } from '@kit/utils/form-client'

interface SingleFieldProps {
  field: SnFieldSchema
  fieldVal: string
  uiState: Record<string, FieldUIState>
}

interface MultiFieldProps {
  fields: { field: SnFieldSchema; fieldVal: string }[]
  uiState: Record<string, FieldUIState>
}

export function useEffectiveFieldState({ field, fieldVal, uiState }: SingleFieldProps): FieldUIState {
  return useMemo(() => computeEffectiveFieldState(field, fieldVal, uiState[field.name]), [
    field,
    fieldVal,
    uiState,
  ])
}

export function useEffectiveFieldStates({ fields, uiState }: MultiFieldProps): Record<string, FieldUIState> {
  return useMemo(() => {
    const result: Record<string, FieldUIState> = {}
    for (const { field, fieldVal } of fields) {
      result[field.name] = computeEffectiveFieldState(field, fieldVal, uiState[field.name])
    }
    return result
  }, [fields, uiState])
}

export function useFieldUIStateManager(formFields: SnFieldsSchema) {
  const [fieldUIState, setFieldUIState] = useState<Record<string, FieldUIState>>({})

  const enforceJournalVisibility = useCallback((nextState: Record<string, FieldUIState>) => {
    const journals = Object.values(formFields).filter(f => f.type === 'journal_input')

    const anyMandatory = journals.some(f => {
      const override = nextState[f.name]
      return override?.mandatory ?? f.mandatory
    })

    // Build a minimal patch over nextState
    const patched: Record<string, FieldUIState> = { ...nextState }
    if (anyMandatory) {
      journals.forEach(f => {
        if (!patched[f.name]?.visible) {
          patched[f.name] = { ...(patched[f.name] ?? {}), visible: true }
        }
      })
    } else {
      journals.forEach(f => {
        const desired = f.visible ?? false
        if (patched[f.name]?.visible !== desired) {
          patched[f.name] = { ...(patched[f.name] ?? {}), visible: desired }
        }
      })
    }
    return patched
  }, [formFields])

  const updateFieldUI = useCallback((field: string, updates: Partial<FieldUIState>) => {
    setFieldUIState(prev => {
      const originalMandatory = prev[field]?.mandatory ?? formFields[field]?.mandatory
      let next = {
        ...prev,
        [field]: {
          ...prev[field],
          ...updates,
        },
      }

      // If a journal's mandatory flips, recompute visibility synchronously on the next snapshot
      if (
        formFields[field]?.type === 'journal_input' &&
        updates.mandatory !== undefined &&
        updates.mandatory !== originalMandatory
      ) {
        next = enforceJournalVisibility(next)
      }

      return next
    })
  }, [formFields, enforceJournalVisibility])

  useEffect(() => {
    // When formFields change, re-enforce once against the current state
    setFieldUIState(prev => enforceJournalVisibility(prev))
  }, [formFields, enforceJournalVisibility])

  return { fieldUIState, updateFieldUI }
}

