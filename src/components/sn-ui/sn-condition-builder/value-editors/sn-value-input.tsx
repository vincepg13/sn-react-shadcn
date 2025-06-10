import { Input } from '@kit/components/ui/input'
import { useEffect, useState } from 'react'
import { SnFieldNumeric } from '@kit/components/sn-form/sn-form-fields/SnFieldNumeric'

type SnValueInputProps = {
  value: string
  disabled: boolean
  type?: string
  onChange: (value: string) => void
}

export function SnValueInput({ value, disabled, type, onChange }: SnValueInputProps) {
  const [localValue, setLocalValue] = useState(value || '')

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const handleValueChange = () => {
    if (localValue !== value) {
      onChange(localValue)
    }
  }

  const isNumeric = type === 'decimal' || type === 'integer'
  if (isNumeric) {
    const scale = type === 'decimal' ? 2 : 0
    const inputVal = localValue ? +localValue : undefined
    return (
      <SnFieldNumeric
        value={inputVal}
        placeholder="Value"
        decimalScale={scale}
        thousandSeparator=","
        decimalSeparator="."
        onValueChange={e => {
          onChange(e?.toString() ?? '')
        }}
      />
    )
  }

  return (
    <Input
      value={localValue}
      disabled={disabled}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={handleValueChange}
      className="w-full"
      placeholder="Value"
    />
  )
}
