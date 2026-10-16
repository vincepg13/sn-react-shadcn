/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef } from 'react'
import { useWatch } from 'react-hook-form'
import { toSafe } from '@kit/components/sn-form/hooks/useDotSafeForm'
import { useUiPolicies } from '@kit/components/sn-form/hooks/useUiPolicies'
import type { SnPolicy } from '@kit/types/form-schema'

type UseCatalogUiPoliciesParams = Parameters<typeof useUiPolicies>[0]

export function useCatalogUiPolicies(params: UseCatalogUiPoliciesParams) {
  const policyRuntime = useUiPolicies(params)
  const conditionFields = useMemo(
    () => [
      ...new Set(
        params.uiPolicies.flatMap((policy: SnPolicy) =>
          policy.conditions.map(condition => condition.field).filter(Boolean)
        )
      ),
    ],
    [params.uiPolicies]
  )
  const safeConditionFields = useMemo(() => conditionFields.map(toSafe), [conditionFields])
  const watchedValues = useWatch({
    control: params.form.control,
    name: safeConditionFields,
  }) as unknown[]
  const previousValuesRef = useRef<unknown[] | null>(null)

  useEffect(() => {
    const currentValues = Array.isArray(watchedValues) ? watchedValues : [watchedValues]
    const previousValues = previousValuesRef.current
    previousValuesRef.current = currentValues
    if (!previousValues) return

    conditionFields.forEach((fieldName, index) => {
      if (!Object.is(previousValues[index], currentValues[index])) {
        policyRuntime.runUiPoliciesForField(fieldName)
      }
    })
  }, [conditionFields, policyRuntime.runUiPoliciesForField, watchedValues])

  return policyRuntime
}
