import { SnValueInput } from './value-editors/sn-value-input'
import { SnValueChoice } from './value-editors/sn-value-choice'
import { SnConditionField, SnConditionRow, SnFieldOperator } from '@kit/types/condition-schema'
import { SnValueDate } from './value-editors/sn-value-date'
import { useCallback } from 'react'
import { SnValueReference } from './value-editors/sn-value-reference'

type SnConditionValueProps = {
  condition: SnConditionRow
  field: SnConditionField
  operator?: SnFieldOperator
  onChange: (updated: Partial<SnConditionRow>) => void
}

const booleanChoices = [
  { label: 'true', value: 'true' },
  { label: 'false', value: 'false' },
]

export function SnConditionValue({ condition, field, operator, onChange }: SnConditionValueProps) {
  const processValue = useCallback(
    (val: string) => {
      onChange({ value: val })
    },
    [onChange]
  )

  if (!operator) return <SnValueInput value={condition.value} disabled={!operator} onChange={processValue} />

  switch (operator?.advancedEditor) {
    case 'boolean':
    case 'choice': {
      const choices = field.choices || booleanChoices
      return <SnValueChoice value={condition.value} choices={choices!} onChange={processValue} />
    }
    case 'reference':
      return (
        <SnValueReference
          table={field.reference!}
          value={condition.value}
          display_value={condition.displayValue || ''}
          displayField={field.referenceDisplayField!}
          onChange={processValue}
        />
      )
    case 'glide_date_choice':
      return (
        <SnValueDate key={field.name} value={condition.value} operator={operator.operator} onChange={processValue} />
      )
    default:
      return <SnValueInput value={condition.value} disabled={!operator} onChange={processValue} />
  }
}
