import { SnConditionMap } from "@kit/types/condition-schema";
import { getTableMetadata } from "@kit/utils/conditions-api";
import { useEffect, useState } from "react";

export const useFieldMetadata = (table: string) => {
  const [columns, setColumns] = useState<SnConditionMap | null>(null);

  useEffect(() => {
    if (!table) return;
    const controller = new AbortController()

    const fetchMetadata = async () => {
      try {
        const tableFields = await getTableMetadata(table, controller);
        if (tableFields) setColumns(tableFields);
      } catch (err) {
        console.error("Failed to fetch columns for table", table, err);
      }
    };

    fetchMetadata();
    return () => controller.abort()
  }, [table]);

  return columns;
};
