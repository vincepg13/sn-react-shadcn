import { Dispatch, SetStateAction } from 'react'
import { SnDotwalkChoice } from '../sn-dotwalk-choice'
import { useCondMeta } from './contexts/SnConditionsContext'
import { SnConditionMap, SnConditionRow } from '@kit/types/condition-schema'

interface SnConditionFieldProps {
  condition: SnConditionRow
  fieldsByTable: Record<string, SnConditionMap>
  setFieldsByTable: Dispatch<SetStateAction<Record<string, SnConditionMap>>>
  onChange: (updated: Partial<SnConditionRow>, table: string) => void
}

export function SnConditionField({ condition, fieldsByTable, setFieldsByTable, onChange }: SnConditionFieldProps) {
  const baseTable = useCondMeta().table

  return (
    <SnDotwalkChoice
      label={condition.fieldLabel}
      baseTable={baseTable}
      fieldsByTable={fieldsByTable}
      setFieldsByTable={setFieldsByTable}
      onChange={onChange}
    />
  )
}
