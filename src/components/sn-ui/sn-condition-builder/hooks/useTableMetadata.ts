import { useEffect, useState } from 'react'
import { SnConditionMap } from '@kit/types/condition-schema'
import { getTableMetadata } from '@kit/utils/conditions-api'

export const useFieldMetadata = (table: string, setError: (msg: string) => void) => {
  const [columns, setColumns] = useState<SnConditionMap | null>(null)

  useEffect(() => {
    if (!table) return
    setColumns(null)

    const controller = new AbortController()
    const fetchMetadata = async () => {
      const tableFields = await getTableMetadata(table, controller, setError)
      if (tableFields) setColumns(tableFields)
    }

    fetchMetadata()
    return () => controller.abort()
  }, [setError, table])

  return columns
}
