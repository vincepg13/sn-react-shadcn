import { SnConditionRow, SnConditionMap } from '@kit/types/condition-schema'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@kit/components/ui/select'

type SnConditionFieldProps = {
  condition: SnConditionRow
  columns: SnConditionMap
  onChange: (updated: SnConditionRow) => void
}

export function SnConditionField({ condition, columns, onChange }: SnConditionFieldProps) {
  const fieldOptions = Object.values(columns).sort((a, b) => a.label.localeCompare(b.label))

  const handleFieldChange = (fieldName: string) => {
    const newField = columns[fieldName]
    const defaultOperator = newField?.operators?.[0]?.operator ?? ''
    onChange({
      ...condition,
      field: fieldName,
      operator: defaultOperator,
      value: '',
      fieldLabel: newField?.label,
      operatorLabel: '',
      fieldType: newField?.type,
    })
  }

  return (
    <Select value={condition.field} onValueChange={handleFieldChange}>
      <SelectTrigger className="w-full truncate">
        <SelectValue placeholder="Field" className="truncate"/>
      </SelectTrigger>
      <SelectContent className="max-h-100">
        {fieldOptions.map(field => (
          <SelectItem key={field.name} value={field.name}>
            {field.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
