import { useEffect, useState } from "react";
import { Row, ColumnDef } from "@tanstack/react-table";
import { SnRow, SnRowItem, SnListViewElement } from "../../types/table-schema";
import { getListView, getListViewElements, getViewPreference } from "../../utils/table-api";
import SnDataTable from "./sn-data-table";

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
  const [fields, setFields] = useState<string[]>([]);

  useEffect(() => {
    const httpController = new AbortController();

    getViewPreference(table, httpController, view)
      .then((r) => {
        const tableView = view !== undefined ? view : r.data.result[0]?.value || "";
        return getListView(table, tableView, httpController);
      })
      .then((r) => {
        return getListViewElements(table, r.data.result, httpController);
      })
      .then((r) => {
        const snFields = r.data.result.map((f: SnListViewElement) => f.element);
        setFields(snFields);
      })
      .catch((error) => {
        console.error("Failed to fetch table schema:", error);
        setFields([]);
      });

    return () => {
      httpController.abort();
    };
  }, [table, view]);

  return (
    <>
      <SnDataTable
        table={table}
        fields={fields}
        query={query}
        onRowClick={onRowClick}
        defaultPageSize={defaultPageSize}
        columnDefinitions={columnDefinitions}
      />
    </>
  );
}
