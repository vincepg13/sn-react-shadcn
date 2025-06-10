import { SnConditionField } from "@kit/types/condition-schema"
import { useCondMeta } from "../contexts/SnConditionsContext"

type SnValueFieldNameProps = {
  field: SnConditionField
  table?: string,
}

export function SnValueFieldName({table, field}: SnValueFieldNameProps) {
  const { table: metaTable, fieldsByTable } = useCondMeta()
  const derivedTable = table || metaTable
  console.log('SnValueFieldName', derivedTable, field, fieldsByTable)
  return <div>FIELD NAME  HERE</div>
}