import { SnConditionField } from '@kit/types/condition-schema'
import { useCondMeta } from '../contexts/SnConditionsContext'
import { SnValueChoice } from './sn-value-choice'

type SnValueFieldNameProps = {
  field: SnConditionField
  value?: string
  table?: string
  clearable?: boolean
  onChange: (value: string, display?: string) => void
}

export function SnValueFieldName({ table, field, value, clearable=true, onChange }: SnValueFieldNameProps) {
  const { table: metaTable, fieldsByTable } = useCondMeta()
  const derivedTable = table || metaTable

  const tableFields = fieldsByTable[derivedTable] || {}
  const fieldList = Object.values(tableFields)
    .filter(f => {
      const ft = f.type
      return ft === 'reference' ? f.reference === field.reference : ft === field.type
    })
    .map(f => ({ label: f.label, value: f.name }))
    .filter(f => f.value !== field.name)
    .sort((a, b) => a.label.localeCompare(b.label))

  return <SnValueChoice value={value || ''} choices={fieldList} clearable={clearable} onChange={onChange} />
}
