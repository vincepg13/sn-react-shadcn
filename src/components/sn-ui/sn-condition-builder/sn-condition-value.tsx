import { Input } from '@kit/components/ui/input'
import { SnConditionRow } from '@kit/types/condition-schema'
import { useEffect, useState } from 'react'

type SnConditionValueProps = {
  condition: SnConditionRow
  onChange: (updated: Partial<SnConditionRow>) => void
}

export function SnConditionValue({ condition, onChange }: SnConditionValueProps) {
  const [value, setValue] = useState(condition.value || '')

  useEffect(() => {
    setValue(condition.value || '')
  }, [condition.value])

  const handleValueChange = () => {
    if (value !== condition.value) {
      onChange({ value }) // ✅ only send the changed part
    }
  }

  return (
    <Input
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={handleValueChange}
      className="w-full"
      placeholder="Value"
    />
  )
}
