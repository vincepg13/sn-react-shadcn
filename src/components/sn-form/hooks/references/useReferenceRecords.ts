import { useCallback, useMemo, useState } from 'react'
import { getRefData } from '../../../../utils/form-api'
import { SnRefFieldEd } from '@kit/types/form-schema'

export type RefRecordRaw = Record<string, string>

export interface RefRecord {
  value: string
  display_value: string
  primary?: string
  secondary?: string
  raw: RefRecordRaw
}

export function useReferenceRecords({
  ed,
  table,
  fieldName,
  recordSysId,
  displayCols,
  formValues,
}: {
  ed: SnRefFieldEd
  table: string
  fieldName: string
  recordSysId: string
  displayCols: string[]
  formValues: Record<string, string>
}) {
  const [records, setRecords] = useState<RefRecord[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const recordValues = useMemo(() => ({
    ...(formValues || {}),
    ...(ed.dependent_field
      ? { [ed.dependent_field]: formValues[ed.dependent_field] }
      : {}),
  }), [formValues, ed.dependent_field])

  const fetchPage = useCallback(
    async (q: string, pageNumber: number, reset = false) => {
      if (loading || (pageNumber > 0 && !hasMore)) return

      setLoading(true)
      try {
        const results = await getRefData({
          table: ed.reference,
          targetTable: table,
          targetField: fieldName,
          targetSysId: recordSysId,
          q,
          qualifier: ed.qualifier || '',
          requiredFields: displayCols,
          recordValues,
          start: pageNumber * 20,
          count: 20,
        })

        const mapped = results.map((item: RefRecordRaw) => ({
          value: item.sys_id,
          display_value: item[displayCols[0]] || item.name || item.title || item.sys_id,
          primary: item[displayCols[1]] || '',
          secondary: item[displayCols[2]] || '',
          raw: item,
        }))

        setRecords(prev => (reset ? mapped : [...prev, ...mapped]))
        setPage(pageNumber)
        setHasMore(mapped.length === 20)
      } catch (err) {
        console.error('Failed to fetch reference data', err)
      } finally {
        setLoading(false)
      }
    },
    [loading, hasMore, ed.reference, ed.qualifier, table, fieldName, recordSysId, displayCols, recordValues]
  )

  return {
    records,
    page,
    hasMore,
    loading,
    fetchPage,
    setPage,
    setRecords,
  }
}
