import { useEffect, useState, useCallback } from 'react'
import { ColumnDef, SortingState, Updater } from '@tanstack/react-table'
import { Row } from '@tanstack/react-table'
import { SnRow, SnRowItem } from '../../types/table-schema'
import { getTableRows, getTableSchema } from '../../utils/table-api'
import { getDefaultSortingFromQuery, getSortedQuery, resolveUpdater } from '../../utils/table-helper'
import { getColumnViaFields } from './columns'
import { DataTable } from './data-table'
import SnDataTableSkeleton from './data-table-skeleton'

interface SnDataTableProps {
  table: string
  fields: string[]
  query?: string
  defaultPageSize?: number
  onRowClick?: (row: Row<SnRow>) => void
  columnDefinitions?: ColumnDef<SnRow, SnRowItem>[]
}

export default function SnDataTable({
  table,
  fields,
  query = '',
  onRowClick,
  defaultPageSize = 20,
  columnDefinitions,
}: SnDataTableProps) {
  const [rows, setRows] = useState<SnRow[]>([])
  const [columns, setColumns] = useState<ColumnDef<SnRow, SnRowItem>[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>(getDefaultSortingFromQuery(query))

  useEffect(() => {
    const defaultSorting = getDefaultSortingFromQuery(query);
    setSorting(defaultSorting);
  }, [query]);

  useEffect(() => {
    if (!fields || fields.length === 0) return

    const httpController = new AbortController()

    getTableSchema(table, httpController)
      .then((r) => {
        setColumns(getColumnViaFields(fields, r.data.result, columnDefinitions))
      })
      .catch((error) => {
        console.error('Failed to fetch table schema:', error)
        setColumns(getColumnViaFields(fields, [], columnDefinitions))
      })

      return () => {
        httpController.abort()
      }
  }, [table, fields, columnDefinitions])

  useEffect(() => {
    if (!fields || fields.length === 0) return

    const offset = pageIndex * pageSize
    const effectiveQuery = sorting.length > 0 ? getSortedQuery(sorting, query) : query
    const fieldsWithGuid = [...fields, 'sys_id'].join(',')
    const httpController = new AbortController()

    getTableRows(table, effectiveQuery, fieldsWithGuid, offset, pageSize, httpController)
      .then((r) => {
        const total = +(r.headers['x-total-count'] || defaultPageSize)
        setRows(r.data.result)
        setPageCount(Math.ceil(total / pageSize))
      })
      .catch((error) => {
        console.error('Failed to fetch table data:', error)
        setRows([])
        setPageCount(0)
      })

    return () => {
      httpController.abort()
    }
  }, [query, table, fields, sorting, pageIndex, pageSize, defaultPageSize])

  const handlePageChange = useCallback(
    (updater: Updater<{ pageIndex: number; pageSize: number }>) => {
      const newState = resolveUpdater(updater, { pageIndex, pageSize })
      setPageIndex(newState.pageIndex)
      setPageSize(newState.pageSize)
    },
    [pageIndex, pageSize]
  )

  return (
    <>
      {!!fields.length && !!columns.length && !!rows.length && (
        <DataTable
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          data={rows}
          columns={columns}
          sorting={sorting}
          onSortingChange={setSorting}
          onPageChange={handlePageChange}
          onRowClick={onRowClick}
        />
      )}
      
      {(!columns.length || !fields.length || !rows.length) && (
        <SnDataTableSkeleton rowCount={defaultPageSize}/>
      )}
    </>
  )
}
