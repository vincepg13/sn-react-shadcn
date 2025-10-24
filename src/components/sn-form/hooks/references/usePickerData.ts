/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react'
import { getTableRows } from '../../../../utils/table-api'
import { SnRow } from '../../../../types/table-schema'
import { SnRecordPickerItem as Record } from '../../../../types/form-schema'
import axios from 'axios'
// import { getRefData } from '@kit/utils/form-api'

interface PickerOptions {
  table: string
  fields: string[]
  query: string
  searchTerm: string
  pageSize: number
  open: boolean
  metaFields: string[]
}

export function usePickerData({ table, fields, query, searchTerm, pageSize, open, metaFields }: PickerOptions) {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const controllerRef = useRef(new AbortController())
  useEffect(() => controllerRef.current.abort(), [])

  useEffect(() => {
    if (open) {
      fetchRecords(0, searchTerm, true)
    }
  }, [table, query, fields, open, searchTerm])

  async function fetchRecords(pageNumber: number, search: string, reset = false) {
    setLoading(true)

    let queryString = query
    let apiFields = [...fields, 'sys_id', ...metaFields]

    if (search) queryString += `^${fields[0]}LIKE${search}`
    if (!query.includes('ORDERBY')) queryString += `^ORDERBY${fields[0]}`

    try {
      controllerRef.current.abort()
      controllerRef.current = new AbortController()
      const res = await getTableRows(
        table,
        queryString,
        apiFields.join(','),
        pageNumber * pageSize,
        pageSize,
        controllerRef.current
      )

      const rows: SnRow[] = res.data.result || []
      const mapped = rows.map((row): Record => {
        const record: Record = {
          meta: row,
          value: row.sys_id.value,
          display_value: row[fields[0]]?.display_value || row[fields[0]]?.value,
        }

        
        if (fields[1]) record.primary = row[fields[1]]?.display_value
        if (fields[2]) record.secondary = row[fields[2]]?.display_value

        let df = fields.slice(1)
        if (df.length > 0) {
          df = df.map(f => row[f].display_value || '').filter(Boolean)
        }

        record.displayFields = df

        return record
      })

      setRecords(prev => (reset ? mapped : [...prev, ...mapped]))
      setHasMore(mapped.length === pageSize)
      setPage(pageNumber)
    } catch (e) {
      if (axios.isAxiosError(e) && e.code === 'ERR_CANCELED') return
      console.error('Fetch failed', e)
    } finally {
      setLoading(false)
    }
  }

  return {
    records,
    loading,
    hasMore,
    page,
    setPage,
    fetchRecords,
  }
}
