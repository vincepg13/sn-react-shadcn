import { SnConditions } from "./sn-conditions";
import { useParsedQuery } from "./hooks/useParsedQuery";
import { useFieldMetadata } from "./hooks/useTableMetadata";

export function SnConditionBuilder({table, encodedQuery}: {table: string, encodedQuery?: string}) {
  const columns = useFieldMetadata(table)
  const model = useParsedQuery(table, encodedQuery || "")

  if (!columns || !model) return null
  return <SnConditions table={table} columns={columns} queryModel={model} onQueryBuilt={console.log}/>
}