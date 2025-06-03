import { Trash2 } from 'lucide-react'
import { SnConditionRow, SnConditionMap } from '@kit/types/condition-schema'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@kit/components/ui/select'
import { SnConditionField } from './sn-condition-field'
import { SnConditionValue } from './sn-condition-value'
import { Button } from '@kit/components/ui/button'
import React, { useCallback } from 'react'

type Props = {
  condition: SnConditionRow
  columns: SnConditionMap
  onDelete: () => void
  onOr: (conditionID: string) => void
  onChange: (updated: SnConditionRow) => void
}

export const ConditionRow = React.memo(function ConditionRow({
  condition,
  columns,
  onDelete,
  onOr,
  onChange,
}: Props) {
  const currentField = columns[condition.field]
  const operatorOptions = currentField?.operators ?? []
  const [currentOperator] = operatorOptions.filter(op => op.operator === condition.operator)

  const handleOperatorChange = useCallback(
    (operator: string) => {
      const label = currentField?.operators.find(o => o.operator === operator)?.label
      onChange({
        ...condition,
        operator,
        operatorLabel: label,
      })
    },
    [onChange, condition, currentField]
  )

  const handleDelete = useCallback(() => {
    onDelete()
  }, [onDelete])

  const handleOr = useCallback(() => {
    onOr(condition.id)
  }, [onOr, condition.id])

  const handleValueChange = useCallback(
    (updated: SnConditionRow) => {
      onChange(updated)
    },
    [onChange]
  )

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_90px] items-center gap-2 py-1">
      <div className="min-w-0">
        <SnConditionField condition={condition} columns={columns} onChange={onChange} />
      </div>

      <div className="min-w-0">
        <Select value={condition.operator} onValueChange={handleOperatorChange}>
          <SelectTrigger className="w-full truncate">
            <SelectValue placeholder="Operator" className="truncate" />
          </SelectTrigger>
          <SelectContent>
            {operatorOptions.map(op => (
              <SelectItem key={op.operator} value={op.operator}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0">
        {currentOperator?.editor !== 'none' && (
          <SnConditionValue condition={condition} onChange={handleValueChange} />
        )}
      </div>

      <div className="flex items-center justify-end gap-1">
        <Button variant="outline" className="px-3" onClick={handleOr}>
          OR
        </Button>
        <Button
          onClick={handleDelete}
          variant="outline"
          size="icon"
          className="hover:text-red-500 hover:bg-red-100"
          aria-label="Delete condition"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}, noRender)

function noRender(prev: Props, next: Props): boolean {
  const a = prev.condition
  const b = next.condition
  return (
    a.id === b.id &&
    a.field === b.field &&
    a.operator === b.operator &&
    a.value === b.value &&
    prev.columns === next.columns
  )
}
