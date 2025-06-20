import { useEffect } from "react";
import { getTableRows } from "../../../utils/table-api";
import { getSortedQuery } from "../../../utils/table-helper";
import { SnRow } from "../../../types/table-schema";
import { SortingState } from "@tanstack/react-table";
import { getAxiosInstance } from "./../../../utils/axios-client";

const axios = getAxiosInstance();

export function useFetchRows({
  table,
  query,
  fields,
  fieldsTable,
  sorting,
  pageIndex,
  pageSize,
  defaultPageSize,
  setRowsLoaded,
  setRows,
  setPageCount,
  setError,
}: {
  table: string;
  query: string;
  fields: string[];
  fieldsTable: string;
  sorting: SortingState;
  pageIndex: number;
  pageSize: number;
  defaultPageSize: number;
  rowsLoaded?: boolean;
  setRowsLoaded: (loaded: boolean) => void;
  setRows: (rows: SnRow[]) => void;
  setPageCount: (count: number) => void;
  setError: (msg: string) => void;
}) {
  useEffect(() => {
    if (!fields || !fields.length || fieldsTable !== table) return setRows([]);
    // setRows([]); - uncomment this to show skeleton between page loads

    const controller = new AbortController();

    const loadRows = async () => {
      setRowsLoaded(false);
      try { 
        const offset = pageIndex * pageSize;
        const effectiveQuery = sorting.length > 0 ? getSortedQuery(sorting, query) : query;
        const fieldsWithGuid = [...fields, "sys_id"].join(",");
        const res = await getTableRows(table, effectiveQuery, fieldsWithGuid, offset, pageSize, controller);
        const total = +(res.headers["x-total-count"] || defaultPageSize);

        setRows(res.data.result);
        setPageCount(Math.ceil(total / pageSize));
        setRowsLoaded(true);
      } catch (error) {
        if (axios.isCancel(error)) {
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
  }, [query, table, fields, fieldsTable, sorting, pageIndex, pageSize, defaultPageSize, setRows, setPageCount, setError, setRowsLoaded]);
}
