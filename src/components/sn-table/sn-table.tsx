import { Row, ColumnDef } from "@tanstack/react-table";
import { SnRow, SnRowItem } from "../../types/table-schema";
import SnDataTable from "./sn-data-table";
import { useFetchFields } from "./hooks/useFetchFields";

interface SnTableProps {
  table: string;
  view?: string;
  query?: string;
  defaultPageSize?: number;
  onRowClick?: (row: Row<SnRow>) => void;
  columnDefinitions?: ColumnDef<SnRow, SnRowItem>[];
}

export default function SnTable({
  table,
  view,
  query,
  onRowClick,
  defaultPageSize = 20,
  columnDefinitions,
}: SnTableProps) {
  /* Hook to fetch fields based on table and view */
  const { fields, error } = useFetchFields({ table, view });

  return (
    <SnDataTable
      table={table}
      fields={fields}
      query={query}
      inputError={error}
      onRowClick={onRowClick}
      defaultPageSize={defaultPageSize}
      columnDefinitions={columnDefinitions}
    />
  );
}
