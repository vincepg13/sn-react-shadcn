import { RHFField } from '../../../types/form-schema'
import { Input } from '../../../components/ui/input'
import { useFieldUI } from '../contexts/FieldUIContext'
import { memo } from 'react'
import { _maxLength } from 'zod/v4/core'

interface SnFieldInputProps {
  rhfField: RHFField
  onChange: (val: string) => void
  onFocus: () => void
  type?: string
  maxLength?: number
}

export const SnFieldInput = memo(function SnFieldInput({
  rhfField,
  maxLength,
  type = 'text',
  onChange,
  onFocus,
}: SnFieldInputProps) {
  const { readonly } = useFieldUI()
  let dv = String(rhfField.value ?? '')

  if (type === 'password') {
    dv = dv.substring(0, 10)
  }

  return (
    <div className={`${readonly ? 'cursor-not-allowed' : ''}`}>
      <Input
        {...rhfField}
        value={dv}
        onFocus={onFocus}
        onBlur={e => onChange(e.target.value)}
        disabled={!!readonly}
        className="w-full"
        type={type}
        maxLength={maxLength}
      />
    </div>
  )
})
