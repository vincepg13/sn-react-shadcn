import { SortingState } from "@tanstack/react-table";
import { getDefaultSortingFromQuery } from "../../../utils/table-helper";
import { useState, useEffect } from "react";

export function useSortingQuery(query: string) {
  const [sorting, setSorting] = useState<SortingState>(getDefaultSortingFromQuery(query));

  useEffect(() => {
    const defaultSorting = getDefaultSortingFromQuery(query);
    setSorting(defaultSorting);
  }, [query]);

  return [sorting, setSorting] as const;
}
