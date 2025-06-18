import { useMemo } from 'react'
import { debounce } from '@tanstack/react-pacer'
import { SnValueDate } from './value-editors/sn-value-date'
import { SnValueInput } from './value-editors/sn-value-input'
import { SnValueChoice } from './value-editors/sn-value-choice'
import { SnValueBetween } from './value-editors/sn-value-between'
import { SnValueCurrency } from './value-editors/sn-value-currency'
import { SnValueReference } from './value-editors/sn-value-reference'
import { SnConditionField, SnConditionRow, SnFieldOperator } from '@kit/types/condition-schema'
import { SnValueFieldName } from './value-editors/sn-value-field-name'
import { SnValueDateEquivalent } from './value-editors/sn-value-date-equivalent'
import { SnValueDateComparative } from './value-editors/sn-value-date-comparative'

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
  const processValue = useMemo(
    () => (val: string) => {
      onChange({ value: val })
    },
    [onChange]
  )

  const processBouncedValue = useMemo(
    () =>
      debounce(
        (val: string) => {
          onChange({ value: val })
        },
        { wait: 300 }
      ),
    [onChange]
  )

  if (!operator) return <SnValueInput value={condition.value} disabled={!operator} onChange={processValue} />

  switch (operator?.advancedEditor) {
    case 'boolean':
    case 'choice': {
      const choices = field.choices || booleanChoices
      return <SnValueChoice value={condition.value} choices={choices!} onChange={processValue} />
    }
    case 'currency':
      return (
        <SnValueCurrency key={field.name} field={field.name} value={condition.value} onChange={processBouncedValue} />
      )
    case 'currency_fields':
    case 'choice_field_names':
      return <SnValueFieldName field={field} table={condition.table} value={condition.value} onChange={processValue} />
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
    case 'glide_date_equivalent':
      return <SnValueDateEquivalent field={field} condition={condition} onChange={processValue} />
    case 'glide_date_comparative':
      return <SnValueDateComparative field={field} condition={condition} onChange={processValue} />
    case 'glide_date_choice': {
      const op = operator.operator || ''
      const showTime = field.type === 'glide_date_time' && (op.startsWith('<') || op.startsWith('>'))
      return (
        <SnValueDate
          key={field.name}
          value={condition.value}
          operator={operator.operator}
          onChange={processValue}
          showTime={showTime}
        />
      )
    }
    case 'between_field':
      return (
        <SnValueBetween
          key={field.name}
          field={field}
          disabled={!operator}
          type={operator.betweenType!}
          value={condition.value}
          onChange={processBouncedValue}
        />
      )
    default:
      return (
        <SnValueInput
          value={condition.value}
          disabled={!operator}
          type={operator.advancedEditor || field.type}
          onChange={processBouncedValue}
        />
      )
  }
}
