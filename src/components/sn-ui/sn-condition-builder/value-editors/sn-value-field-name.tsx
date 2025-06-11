import { SnConditionField } from '@kit/types/condition-schema'
import { useCondMeta } from '../contexts/SnConditionsContext'
import { SnValueChoice } from './sn-value-choice'

type SnValueFieldNameProps = {
  field: SnConditionField
  value?: string
  table?: string
  onChange: (value: string) => void
}

export function SnValueFieldName({ table, field, value, onChange }: SnValueFieldNameProps) {
  const { table: metaTable, fieldsByTable } = useCondMeta()
  const derivedTable = table || metaTable

  const tableFields = fieldsByTable[derivedTable] || {}
  const fieldList = Object.values(tableFields)
    .filter(f => f.type === field.type)
    .map(f => ({ label: f.label, value: f.name }))
    .filter(f => f.value !== field.name) 

  return <SnValueChoice value={value || ''} choices={fieldList} onChange={onChange} />
}
