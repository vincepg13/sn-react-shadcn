import { useEffect, useState } from 'react'
import { Input } from '@kit/components/ui/input'

type SnValueInputProps = {
  value: string
  disabled: boolean
  onChange: (value: string) => void
}

export function SnValueInput({ value, disabled, onChange }: SnValueInputProps) {
  const [localValue, setLocalValue] = useState(value || '')

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const handleValueChange = () => {
    if (localValue !== value) {
      onChange(localValue)
    }
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
