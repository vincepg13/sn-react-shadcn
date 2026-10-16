import { useEffect, useMemo, useRef, useState } from 'react'
import { getReferenceRecordsByIds, getTableDisplayFields } from '@kit/utils/form-api'
import type { RefRecord } from './useReferenceRecords'

type UseReferenceDisplayResolutionParams = {
  fieldName: string
  referenceTable?: string
  values: string[]
  displayValues: string[]
  displayFields: string[]
  displayFieldApi?: string
  onResolved: (records: RefRecord[], displayValue: string) => void
}

export function useReferenceDisplayResolution({
  fieldName,
  referenceTable,
  values,
  displayValues,
  displayFields,
  displayFieldApi,
  onResolved,
}: UseReferenceDisplayResolutionParams) {
  const onResolvedRef = useRef(onResolved)
  const attemptedResolutionRef = useRef('')
  const [isResolving, setIsResolving] = useState(false)
  const unresolvedValues = useMemo(
    () =>
      values.filter((value, index) => {
        const displayValue = displayValues[index]
        return value && (!displayValue || displayValue === value)
      }),
    [displayValues, values]
  )
  const resolutionKey = `${referenceTable || ''}:${unresolvedValues.join(',')}:${displayFields.join(',')}`

  useEffect(() => {
    onResolvedRef.current = onResolved
  }, [onResolved])

  useEffect(() => {
    if (!referenceTable || unresolvedValues.length === 0) {
      attemptedResolutionRef.current = ''
      setIsResolving(false)
      return
    }
    if (attemptedResolutionRef.current === resolutionKey) return
    attemptedResolutionRef.current = resolutionKey

    const controller = new AbortController()
    let active = true
    setIsResolving(true)

    void Promise.resolve()
      .then(async () => {
        const fields = displayFields.length
          ? displayFields
          : await getTableDisplayFields(referenceTable, displayFieldApi)
        const results = await getReferenceRecordsByIds(
          referenceTable,
          unresolvedValues,
          fields,
          controller.signal
        )
        if (!active) return

        const displayField = fields[0]
        const recordsById = new Map(results.map(item => [item.sys_id, item]))
        const resolvedRecords = values.map((value, index) => {
          const currentDisplay = displayValues[index]
          const record = recordsById.get(value)
          const resolvedDisplay =
            (currentDisplay && currentDisplay !== value ? currentDisplay : undefined) ||
            (displayField ? record?.[displayField] : undefined) ||
            record?.name ||
            record?.title ||
            ''

          return {
            value,
            display_value: resolvedDisplay,
            raw: record || {},
          }
        })

        onResolvedRef.current(
          resolvedRecords,
          resolvedRecords.map(record => record.display_value).join(',')
        )
      })
      .catch(error => {
        if (active && !controller.signal.aborted) {
          console.error(`Failed to resolve reference display value for ${fieldName}`, error)
        }
      })
      .finally(() => {
        if (active) setIsResolving(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [
    displayFieldApi,
    displayFields,
    displayValues,
    fieldName,
    referenceTable,
    resolutionKey,
    unresolvedValues,
    values,
  ])

  return {
    isResolving:
      !!referenceTable &&
      unresolvedValues.length > 0 &&
      (isResolving || attemptedResolutionRef.current !== resolutionKey),
  }
}
