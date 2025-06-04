import { Trash2 } from 'lucide-react'
import { memo, useCallback } from 'react'
import { Button } from '@kit/components/ui/button'
import { SnConditionField } from './sn-condition-field'
import { SnConditionValue } from './sn-condition-value'
import { useCondMeta } from './contexts/SnConditionsContext'
import { SnConditionRow, SnConditionMap } from '@kit/types/condition-schema'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@kit/components/ui/select'

type Props = {
  condition: SnConditionRow
  columns: SnConditionMap
  onDelete: () => void
  onOr: (conditionID: string) => void
  onChange: (updated: Partial<SnConditionRow>) => void
}

export const ConditionRow = memo(function ConditionRow({ condition, onDelete, onOr, onChange }: Props) {
  const { table, fieldsByTable, setFieldsByTable } = useCondMeta()
  const tableName = condition.table ?? table
  const conditionField = condition.field?.split('.').pop() || ''

  const handleOperatorChange = useCallback(
    (operator: string) => {
      const currentField = fieldsByTable[tableName]?.[conditionField]
      const label = currentField?.operators.find(o => o.operator === operator)?.label
      onChange({ operator, operatorLabel: label })
    },
    [onChange, fieldsByTable, tableName, conditionField]
  )

  const handleDelete = useCallback(() => {
    onDelete()
  }, [onDelete])

  const handleOr = useCallback(() => {
    onOr(condition.id)
  }, [onOr, condition.id])

  const handleValueChange = useCallback(
    (updated: Partial<SnConditionRow>) => {
      onChange({ ...updated, table: condition.table })
    },
    [onChange, condition.table]
  )

  const handleFieldChange = useCallback(
    (updated: Partial<SnConditionRow>) => {
      const { field, fieldLabel, operator, operatorLabel, fieldType, value, table } = updated
      onChange({ field, fieldLabel, operator, operatorLabel, fieldType, value, table })
    },
    [onChange]
  )

  if (!fieldsByTable[tableName]) return null
  const currentField = fieldsByTable[tableName][conditionField]
  const operatorOptions = currentField?.operators ?? []
  const [currentOperator] = operatorOptions.filter(op => op.operator === condition.operator)

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_90px] items-center gap-2 py-1">
      <div className="min-w-0">
        <SnConditionField
          condition={condition}
          fieldsByTable={fieldsByTable}
          setFieldsByTable={setFieldsByTable}
          onChange={handleFieldChange}
        />
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
        {currentOperator?.editor !== 'none' && <SnConditionValue condition={condition} onChange={handleValueChange} />}
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
  return prev.condition === next.condition
}
