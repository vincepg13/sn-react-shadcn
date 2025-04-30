import { useState, useEffect } from "react";
import axios from "axios";
import {
  getListView,
  getListViewElements,
  getViewPreference,
} from "../../../utils/table-api";
import { SnListViewElement } from "../../../types/table-schema";

export function useFetchFields({
  table,
  view,
}: {
  table: string;
  view?: string;
}) {
  const [fields, setFields] = useState<string[]>([]);
  const [fieldsTable, setFieldsTable] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!table) {
      console.warn("No table specified for fetching fields");
      return;
    }

    const controller = new AbortController();

    const loadFields = async () => {
      try {
        const prefRes = await getViewPreference(table, controller, view);
        const tableView =
          view !== undefined ? view : prefRes.data.result[0]?.value || "";

        const listViewRes = await getListView(table, tableView, controller);

        if (!listViewRes.data.result || listViewRes.data.result.length === 0) {
          setError(`No list view found for the supplied table: ${table}`);
          setFields([]);
          return;
        }

        const elementsRes = await getListViewElements(
          table,
          listViewRes.data.result,
          controller
        );
        const snFields = elementsRes.data.result.map(
          (f: SnListViewElement) => f.element
        );

        setFields(snFields);
        setFieldsTable(table);
        setError("");
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.code !== "ERR_CANCELED") {
          setError("Failed to fetch table view");
        }
        setFields([]);
      }
    };

    loadFields();

    return () => {
      controller.abort();
    };
  }, [table, view]);

  return { fields, fieldsTable, error };
}
