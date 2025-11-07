import { Trash2 } from 'lucide-react'
import { memo, useCallback, useRef } from 'react'
import { Button } from '@kit/components/ui/button'
import { SnConditionField } from './sn-condition-field'
import { SnConditionValue } from './sn-condition-value'
import { useCondMeta } from './contexts/SnConditionsContext'
import { SnConditionRow, SnConditionMap, SnFieldOperator } from '@kit/types/condition-schema'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@kit/components/ui/select'
import { getChangeOperators } from '@kit/lib/sn-condition'

type Props = {
  condition: SnConditionRow
  columns: SnConditionMap
  onDelete: () => void
  onOr: (conditionID: string) => void
  onChange: (updated: Partial<SnConditionRow>) => void
}

function ConditionRowComponent({ condition, onDelete, onOr, onChange }: Props) {
  const { table, fieldsByTable, extended, setFieldsByTable } = useCondMeta()

  const lastEditor = useRef('')
  const tableName = condition.table ?? table
  const conditionField = condition.field?.split('.').pop() || ''

  const handleOperatorChange = useCallback(
    (operator: string) => {
      const currentField = fieldsByTable[tableName]?.[conditionField]
      const fieldOp = currentField?.operators?.find(o => o.operator === operator)
      const label = fieldOp?.label

      if (fieldOp?.advancedEditor === lastEditor.current) onChange({ operator, operatorLabel: label })
      else onChange({ operator, operatorLabel: label, value: '' })

      lastEditor.current = fieldOp?.advancedEditor || ''
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
  if (extended && operatorOptions.length > 0) {
    const changeOps = getChangeOperators(currentField.type)

    if (changeOps.includes('fvc') && !hasOperator(operatorOptions, 'VALCHANGES')) {
      operatorOptions.push({ label: 'changes', editor: 'none', operator: 'VALCHANGES', advancedEditor: 'none' })
    }

    const firstOpt = operatorOptions[0]
    if (changeOps.includes('fvf') && !hasOperator(operatorOptions, 'CHANGESFROM')) {
      operatorOptions.push({ ...firstOpt, label: 'changes from', operator: 'CHANGESFROM' })
    }
    if (changeOps.includes('fvt') && !hasOperator(operatorOptions, 'CHANGESTO')) {
      operatorOptions.push({ ...firstOpt, label: 'changes to', operator: 'CHANGESTO' })
    }
  }

  const [currentOperator] = operatorOptions.filter(op => op.operator === condition.operator)

  return (
    <div className="flex flex-col gap-2 py-1 lg:grid lg:grid-cols-[1fr_1fr_1fr_90px] lg:items-start overflow-x-auto">
      {/* Row 1 on mobile, Columns 1 & 2 on desktop */}
      <div className="grid grid-cols-[1fr_1fr] gap-2 lg:contents">
        <div className="col-start-1">
          <SnConditionField
            condition={condition}
            fieldsByTable={fieldsByTable}
            setFieldsByTable={setFieldsByTable}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-start-2">
          <Select value={condition.operator} onValueChange={handleOperatorChange} disabled={!currentField}>
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
      </div>

      {/* Row 2 on mobile, Columns 3 & 4 on desktop */}
      <div className="grid grid-cols-[1fr_90px] gap-2 lg:contents">
        <div className="col-start-1 lg:col-start-3">
          {currentOperator?.editor !== 'none' && (
            <SnConditionValue
              condition={condition}
              field={currentField}
              operator={currentOperator}
              onChange={handleValueChange}
            />
          )}
        </div>

        <div className="col-start-2 lg:col-start-4 flex items-center justify-end gap-1">
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
    </div>
  )
}

function hasOperator(operators: SnFieldOperator[], operator: string) {
  return operators.some(op => op.operator === operator)
}

export const ConditionRow = memo(ConditionRowComponent, (p, n) => p.condition === n.condition)
