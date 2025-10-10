// hooks/useUiPolicies.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SnFormConfig, SnPolicy, SnPolicyCondition, SnPolicyScript } from './../../../types/form-schema'
import { useCallback, useEffect, useMemo } from 'react'
import { FieldUIState, SnFieldsSchema } from '@kit/types/form-schema'
import { evaluateAndApplyPolicy } from '../../../utils/form-policy'

interface UseUiPoliciesOptions {
  form: any
  formFields: SnFieldsSchema | null
  uiPolicies: SnPolicy[]
  executePolicyScript: (script: SnPolicyScript) => any
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void
  formConfig: SnFormConfig | null
}

export function useUiPolicies({
  form,
  formFields,
  uiPolicies,
  updateFieldUI,
  executePolicyScript,
  formConfig,
}: UseUiPoliciesOptions) {
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
        evaluateAndApplyPolicy(form, formFields, policy, executePolicyScript, updateFieldUI, formConfig)
    }
  }, [formConfig, formFields, uiPolicies, form, executePolicyScript, updateFieldUI])

  const runUiPoliciesForField = useCallback(
    (fieldName: string) => {
      if (!formConfig || !formFields) return

      const relatedPolicies = policyIndex.get(fieldName) || []
      for (const policy of relatedPolicies) {
        evaluateAndApplyPolicy(form, formFields, policy, executePolicyScript, updateFieldUI, formConfig)
      }
    },
    [formConfig, formFields, policyIndex, form, executePolicyScript, updateFieldUI]
  )

  useEffect(() => {
    if (!formFields || uiPolicies.length === 0) return

    const values = form.getValues()
    const hasAnyValue = Object.values(values).some(v => v !== undefined && v !== null)

    if (hasAnyValue) runUiPolicies()
  }, [form, formFields, runUiPolicies, uiPolicies])

  return {
    uiPolicies,
    runUiPolicies,
    runUiPoliciesForField,
  }
}
