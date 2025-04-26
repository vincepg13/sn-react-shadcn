import { useEffect } from "react";
import { getTableSchema } from "../../../utils/table-api"; // adjust your path
import { getColumnViaFields } from "../columns"; // adjust your path

export function useFetchSchema({
  table,
  fields,
  columnDefinitions,
  setColumns,
  setError,
}: {
  table: string;
  fields: string[];
  columnDefinitions?: any; // tighten typing later
  setColumns: (cols: any[]) => void;
  setError: (msg: string) => void;
}) {
  useEffect(() => {
    if (!fields || fields.length === 0) return

    const controller = new AbortController();

    const loadSchema = async () => {
      try {
        const res = await getTableSchema(table, controller);
        setColumns(getColumnViaFields(fields, res.data.result, columnDefinitions));
      } catch (error) {
        setColumns(getColumnViaFields(fields, [], columnDefinitions));
        setError("Failed to fetch table schema");
      }
    };

    if (table) loadSchema();

    return () => {
      controller.abort();
    };
  }, [table, fields, columnDefinitions]);
}
