/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { getTableRows } from '../../../utils/table-api'
import { SnRow } from '@/types/table-schema'
import { SnRecordPickerItem as Record } from '@/types/form-schema'
import axios from 'axios'

interface PickerOptions {
  table: string
  fields: string[]
  query: string
  searchTerm: string
  pageSize: number
  open: boolean
}

export function usePickerData({ table, fields, query, searchTerm, pageSize, open }: PickerOptions) {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (open) {
      fetchRecords(0, searchTerm, true)
    }
  }, [table, query, fields, open, searchTerm])

  async function fetchRecords(pageNumber: number, search: string, reset = false) {
    setLoading(true)

    let queryString = query
    const apiFields = [...fields, 'sys_id']

    if (search) queryString += `^${fields[0]}LIKE${search}`
    if (!query.includes('ORDERBY')) queryString += `^ORDERBY${fields[0]}`

    try {
      const controller = new AbortController()
      const res = await getTableRows(
        table,
        queryString,
        apiFields.join(','),
        pageNumber * pageSize,
        pageSize,
        controller
      )

      const rows: SnRow[] = res.data.result || []
      const mapped = rows.map((row): Record => {
        const record: Record = {
          value: row.sys_id.value,
          display_value: row[fields[0]]?.display_value || row[fields[0]]?.value,
        }

        if (fields[1] !== 'sys_id') record.primary = row[fields[1]]?.display_value
        if (fields[2] !== 'sys_id') record.secondary = row[fields[2]]?.display_value
        return record
      })

      setRecords(prev => (reset ? mapped : [...prev, ...mapped]))
      setHasMore(mapped.length === pageSize)
      setPage(pageNumber)
    } catch (e) {
      if (!axios.isCancel(e)) console.error('Fetch failed', e)
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
