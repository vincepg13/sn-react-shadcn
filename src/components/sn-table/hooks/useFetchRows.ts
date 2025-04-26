import { useEffect } from "react";
import { getTableRows } from "../../../utils/table-api";
import { getSortedQuery } from "../../../utils/table-helper";
import axios from "axios"; // optional, only if you want to check for cancel

export function useFetchRows({
  table,
  query,
  fields,
  sorting,
  pageIndex,
  pageSize,
  defaultPageSize,
  setRows,
  setPageCount,
  setError,
}: {
  table: string;
  query: string;
  fields: string[];
  sorting: any[]; // type better later
  pageIndex: number;
  pageSize: number;
  defaultPageSize: number;
  setRows: (rows: any[]) => void;
  setPageCount: (count: number) => void;
  setError: (msg: string) => void;
}) {
  useEffect(() => {
    if (!fields || fields.length === 0) {
      console.log("ABORT NO FIELDS FOR ROWS");
      return;
    }

    const controller = new AbortController();

    const loadRows = async () => {
      try {
        const offset = pageIndex * pageSize;
        const effectiveQuery = sorting.length > 0 ? getSortedQuery(sorting, query) : query;
        const fieldsWithGuid = [...fields, "sys_id"].join(",");

        const res = await getTableRows(table, effectiveQuery, fieldsWithGuid, offset, pageSize, controller);
        const total = +(res.headers["x-total-count"] || defaultPageSize);

        setRows(res.data.result);
        setPageCount(Math.ceil(total / pageSize));
      } catch (error) {
        if (axios.isCancel(error)) {
          console.warn("ROWS FETCH ABORTED");
          return;
        }
        console.error("Failed to fetch table rows:", error);
        setRows([]);
        setPageCount(0);
        setError("Failed to fetch table rows");
      }
    };

    loadRows();

    return () => {
      controller.abort();
    };
  }, [query, table, fields, sorting, pageIndex, pageSize, defaultPageSize, setRows, setPageCount, setError]);
}
