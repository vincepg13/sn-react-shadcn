import { SortingState, Updater } from "@tanstack/react-table";
import { SnColSchema } from "../types/table-schema";

function isUpdaterFunction<T>(updater: Updater<T>): updater is (prev: T) => T {
  return typeof updater === "function";
}

export function resolveUpdater<T>(updater: Updater<T>, previous: T): T {
  return isUpdaterFunction(updater) ? updater(previous) : updater;
}

export function getColumnLabel(field: string, colSchema: SnColSchema[]): string {
  const column = colSchema.find((col) => col.name === field);
  if (column) {
    return column.label || field.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
  }
  return field.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export function getSortedQuery(sorting: SortingState, query: string): string {
  const sortKey = `^ORDERBY${sorting[0].desc ? "DESC" : ""}${sorting[0].id}`;

  if (query.includes("ORDERBY")) {
    return query.replace(/\^?ORDERBY[^^]*/, sortKey);
  }

  return `${query}${sortKey}`;
}

export function getDefaultSortingFromQuery(query?: string): SortingState {
  if (!query) return [];

  const match = query.match(/ORDERBY(DESC)?([a-zA-Z0-9_]+)/i);
  if (!match) return [];

  const [, descFlag, field] = match;
  return [
    {
      id: field,
      desc: !!descFlag,
    },
  ];
}
