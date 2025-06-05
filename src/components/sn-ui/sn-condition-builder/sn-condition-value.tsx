import { SnValueInput } from './value-editors/sn-value-input'
import { SnValueChoice } from './value-editors/sn-value-choice'
import { SnConditionField, SnConditionRow, SnFieldOperator } from '@kit/types/condition-schema'
import { SnValueDate } from './value-editors/sn-value-date'
import { useCallback } from 'react'

type SnConditionValueProps = {
  condition: SnConditionRow
  field: SnConditionField
  operator?: SnFieldOperator
  onChange: (updated: Partial<SnConditionRow>) => void
}

export function SnConditionValue({ condition, field, operator, onChange }: SnConditionValueProps) {
  const processValue = useCallback((val: string) => {
    onChange({ value: val })
  }, [onChange])

  if (!operator) return <SnValueInput value={condition.value} disabled={!operator} onChange={processValue} />

  switch (operator?.advancedEditor) {
    case 'choice':
      return <SnValueChoice value={condition.value} choices={field.choices!} onChange={processValue} />
    case 'glide_date_choice':
      return <SnValueDate value={condition.value} operator={operator.operator} onChange={processValue} />
    default:
      return <SnValueInput value={condition.value} disabled={!operator} onChange={processValue} />
  }
}
