import { SnConditionField, SnConditionRow } from '@kit/types/condition-schema'
import { SnValueFieldName } from './sn-value-field-name'
import { useCondMeta } from '../contexts/SnConditionsContext'
import { Input } from '@kit/components/ui/input'
import { useEffect, useState } from 'react'
import { SnValueChoice } from './sn-value-choice'

type SnValueDateEquivalentProps = {
  field: SnConditionField
  condition: SnConditionRow
  onChange: (value: string) => void
}

export function SnValueDateEquivalent({ field, condition, onChange }: SnValueDateEquivalentProps) {
  const { dateMeta } = useCondMeta()
  const durations = dateMeta?.equivalentDurations.map(d => ({
    label: d[0],
    value: d[1],
  }))

  const parts = condition.value?.split('@') || []
  const [duration, setDuration] = useState<string>(parts[1] || '')
  const [equivalentField, setEquivalentField] = useState<string>(parts[0] || '')

  useEffect(() => {
    onChange(`${equivalentField}@${duration}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, equivalentField])

  if (!dateMeta || !durations) return <Input disabled={true} className="w-full" placeholder="Loading..." />

  return (
    <div className="flex items-center gap-2">
      <SnValueChoice value={duration} choices={durations} clearable={false} onChange={setDuration} />
      <SnValueFieldName field={field} table={condition.table} value={equivalentField} clearable={false} onChange={setEquivalentField} />
    </div>
  )
}
