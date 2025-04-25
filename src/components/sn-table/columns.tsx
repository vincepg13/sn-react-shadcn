import React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { getColumnLabel } from '../../utils/table-helper'
import { SnRow, SnRowItem, SnColSchemea } from '../../types/table-schema'
import { DataTableColumnHeader } from './data-table-column-header'

export function getColumnViaFields(
  fields: string[],
  colSchema: SnColSchemea[] = [],
  providedDefs?: ColumnDef<SnRow, SnRowItem>[]
): ColumnDef<SnRow, SnRowItem>[] {
  const columns: ColumnDef<SnRow, SnRowItem>[] = fields.map((field, index) => {
    const label = getColumnLabel(field, colSchema);

    if (providedDefs) {
      const existingColumn = providedDefs.find((col) => col.id === field)
      if (existingColumn) {
        const originalHeader = existingColumn.header

        return {
          ...existingColumn,
          accessorKey: field,
          header: (ctx) => {
            const headerElement =
              typeof originalHeader === 'function' ? originalHeader(ctx) : null

            return headerElement
              ? React.cloneElement(headerElement, {
                  ...headerElement.props,
                  title: label,
                })
              : null
          },
        }
      }
    }

    let cellClasses = 'whitespace-normal'
    if (!index) cellClasses += ' pl-4'

    return {
      id: field,
      accessorKey: field,
      header: ({ column }) => (
        <DataTableColumnHeader
          className={index === 0 ? 'pl-4' : ''}
          column={column}
          title={label}
        />
      ),
      cell: ({ getValue }) => (
        <div className={cellClasses}>{getValue()?.display_value}</div>
      ),
      enableSorting: true,
      enableHiding: true,
    }
  })

  return columns
}
