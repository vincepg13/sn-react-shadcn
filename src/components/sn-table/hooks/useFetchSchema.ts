import { useEffect } from "react";
import { getTableSchema } from "../../../utils/table-api";
import { getColumnViaFields } from "../columns";
import { SnRow, SnRowItem } from "../../../types/table-schema";
import { ColumnDef } from "@tanstack/react-table";

export function useFetchSchema({
  table,
  fields,
  fieldsTable,
  columnDefinitions,
  setColumns,
  setError,
}: {
  table: string;
  fields: string[];
  fieldsTable: string;
  columnDefinitions?: ColumnDef<SnRow, SnRowItem>[];
  setColumns: (cols: ColumnDef<SnRow, SnRowItem>[]) => void;
  setError: (msg: string) => void;
}) {
  useEffect(() => {
    if (!fields || !fields.length || fieldsTable !== table) return

    const controller = new AbortController();

    const loadSchema = async () => {
      try {
        const res = await getTableSchema(table, controller);
        setColumns(getColumnViaFields(fields, res.data.result, columnDefinitions));
      } catch (error) {
        setColumns(getColumnViaFields(fields, [], columnDefinitions));
        setError("Failed to fetch table schema: " + error);
      }
    };

    if (table) loadSchema();

    return () => {
      controller.abort();
    };
  }, [table, fields, fieldsTable, columnDefinitions, setColumns, setError]);
}
