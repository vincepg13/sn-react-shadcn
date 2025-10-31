import { Row, ColumnDef } from '@tanstack/react-table'
import { SnRow, SnRowItem } from '../../types/table-schema'
import SnDataTable from './sn-data-table'
import { useFetchFields } from './hooks/useFetchFields'
import { useEffect } from 'react'

interface SnTableProps {
  table: string
  view?: string
  query?: string
  defaultPageSize?: number
  onViewDefined?: (view: string) => void
  onRowClick?: (row: Row<SnRow>) => void
  columnDefinitions?: ColumnDef<SnRow, SnRowItem>[]
}

export default function SnTable({
  table,
  view,
  query,
  onRowClick,
  onViewDefined,
  defaultPageSize = 20,
  columnDefinitions,
}: SnTableProps) {
  /* Hook to fetch fields based on table and view */
  const { fields, fieldsTable, error, targetView } = useFetchFields({ table, view })

  useEffect(() => {
    if (targetView === null) return
    onViewDefined?.(targetView)
  }, [onViewDefined, targetView])

  return (
    <SnDataTable
      table={table}
      fields={fields}
      fieldsTable={fieldsTable}
      query={query}
      inputError={error}
      onRowClick={onRowClick}
      defaultPageSize={defaultPageSize}
      columnDefinitions={columnDefinitions}
    />
  )
}
