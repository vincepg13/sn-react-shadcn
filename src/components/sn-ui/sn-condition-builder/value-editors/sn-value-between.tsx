import { useCallback, useState } from 'react'
import { SnValueDate } from './sn-value-date'
import { SnConditionField } from '@kit/types/condition-schema'
import { SnValueInput } from './sn-value-input'

type BetweenProps = {
  type: string
  value: string
  field: SnConditionField
  disabled: boolean
  onChange: (val: string) => void
}

export function SnValueBetween({ field, type, value, disabled, onChange }: BetweenProps) {
  const inputVal = value ? value.split('@') : ['', '']
  const [startVal, setStartVal] = useState(inputVal[0])
  const [endVal, setEndVal] = useState(inputVal[1])
  const handleChange = useCallback(
    (which: 'start' | 'end', val: string) => {
      if (which === 'start') setStartVal(val)
      else setEndVal(val)

      const s = which === 'start' ? val : startVal
      const e = which === 'end' ? val : endVal
      if (s && e) onChange(`${s}@${e}`)
    },
    [startVal, endVal, onChange]
  )

  if (type === 'glide_date_choice') {
    const showTime = field.type === 'glide_date_time'
    return (
      <div className="flex flex-col xl:flex-row gap-1">
        <SnValueDate
          key={field.name + 'B1'}
          showTime={showTime}
          value={startVal}
          operator="<"
          onChange={val => handleChange('start', val)}
        />
        <SnValueDate key={field.name + 'B2'} value={endVal} operator=">" onChange={val => handleChange('end', val)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col xl:flex-row gap-1">
      <SnValueInput value={startVal} disabled={disabled} onChange={val => handleChange('start', val)} />
      <SnValueInput value={endVal} disabled={disabled} onChange={val => handleChange('end', val)} />
    </div>
  )
}
