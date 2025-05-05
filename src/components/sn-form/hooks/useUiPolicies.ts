// hooks/useUiPolicies.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SnFormConfig, SnPolicy, SnPolicyCondition } from './../../../types/form-schema'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FieldUIState, SnFieldsSchema } from '@kit/types/form-schema'
import { evaluateAndApplyPolicy } from '../../../utils/form-policy'

interface UseUiPoliciesOptions {
  form: any
  formFields: SnFieldsSchema | null
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void
  formConfig: SnFormConfig | null
}

export function useUiPolicies({ form, formFields, updateFieldUI, formConfig }: UseUiPoliciesOptions) {
  const [uiPolicies, setUiPolicies] = useState<SnPolicy[]>([])

  const policyIndex = useMemo(() => {
    const map = new Map<string, SnPolicy[]>()

    for (const policy of uiPolicies) {
      const fields = new Set(policy.conditions.map((c: SnPolicyCondition) => c.field))

      for (const field of fields) {
        if (!map.has(field)) map.set(field, [])
        map.get(field)!.push(policy)
      }
    }
    return map
  }, [uiPolicies])

  const runUiPolicies = useCallback(() => {
    if (!formConfig || !formFields) return

    for (const policy of uiPolicies) {
      if (policy.onload)
        evaluateAndApplyPolicy(form, formFields, policy, updateFieldUI, formConfig)
    }
  }, [uiPolicies, form, formFields, updateFieldUI, formConfig])

  const runUiPoliciesForField = useCallback(
    (fieldName: string) => {
      if (!formConfig || !formFields) return

      console.log('Running UI policies for field:', fieldName)
      const relatedPolicies = policyIndex.get(fieldName) || []
      for (const policy of relatedPolicies) {
        evaluateAndApplyPolicy(form, formFields, policy, updateFieldUI, formConfig)
      }
    },
    [policyIndex, form, formFields, updateFieldUI, formConfig]
  )

  useEffect(() => {
    if (!formFields || uiPolicies.length === 0) return

    const values = form.getValues()
    const hasAnyValue = Object.values(values).some(v => v !== undefined && v !== null)

    if (hasAnyValue) runUiPolicies()
  }, [form, formFields, runUiPolicies, uiPolicies])

  return {
    uiPolicies,
    setUiPolicies,
    runUiPolicies,
    runUiPoliciesForField,
  }
}
