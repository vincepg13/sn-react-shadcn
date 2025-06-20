import { SnDataTableSkeleton, SnDataTableSkeletonError } from "./data-table-skeleton";
import { useState, useCallback } from "react";
import { ColumnDef, Updater } from "@tanstack/react-table";
import { Row } from "@tanstack/react-table";
import { SnRow, SnRowItem } from "../../types/table-schema";
import { resolveUpdater } from "../../utils/table-helper";
import { DataTable } from "./data-table";
import { useErrorState } from "./hooks/useErrorState";
import { useSortingQuery } from "./hooks/useSortingQuery";
import { useFetchSchema } from "./hooks/useFetchSchema";
import { useFetchRows } from "./hooks/useFetchRows";

interface SnDataTableProps {
  table: string;
  fields: string[];
  fieldsTable?: string;
  query?: string;
  inputError?: string;
  defaultPageSize?: number;
  onRowClick?: (row: Row<SnRow>) => void;
  columnDefinitions?: ColumnDef<SnRow, SnRowItem>[];
}

export default function SnDataTable({
  table,
  fields,
  fieldsTable,
  query = "",
  inputError,
  onRowClick,
  defaultPageSize = 20,
  columnDefinitions,
}: SnDataTableProps) {
  const [error, setError] = useErrorState(inputError || "");
  const [rows, setRows] = useState<SnRow[]>([]);
  const [rowsLoaded, setRowsLoaded] = useState(false);
  const [columns, setColumns] = useState<ColumnDef<SnRow, SnRowItem>[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageCount, setPageCount] = useState(0);
  const [sorting, setSorting] = useSortingQuery(query);

  /* Fetch column schema for column labels */
  useFetchSchema({
    table,
    fields,
    fieldsTable: fieldsTable || table,
    columnDefinitions,
    setColumns,
    setError,
  });

  /* Fetch row data from servicenow records */
  useFetchRows({
    table,
    query,
    fields,
    fieldsTable: fieldsTable || table,
    sorting,
    pageIndex,
    pageSize,
    defaultPageSize,
    rowsLoaded,
    setRowsLoaded,
    setRows,
    setPageCount,
    setError,
  });

  /* Handle page changes */
  const handlePageChange = useCallback(
    (updater: Updater<{ pageIndex: number; pageSize: number }>) => {
      const newState = resolveUpdater(updater, { pageIndex, pageSize });
      setPageIndex(newState.pageIndex);
      setPageSize(newState.pageSize);
    },
    [pageIndex, pageSize]
  );

  return (
    <>
    { error && <SnDataTableSkeletonError error={error} />}

    { !error && (
      rowsLoaded ? (
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
      ) : (
        <SnDataTableSkeleton rowCount={defaultPageSize} />
      )
    )}
    </>
  );
}
