import { SnFieldSchema, RHFField } from '../../../types/form-schema'
import { Textarea } from '../../ui/textarea'

interface SnFieldTextareaProps {
  field: SnFieldSchema
  rhfField: RHFField
  onChange: (val: string) => void
  onFocus: () => void
}

export function SnFieldTextarea({ field, rhfField, onChange, onFocus }: SnFieldTextareaProps) {
  return (
    <Textarea
      {...rhfField}
      value={String(rhfField.value ?? '')}
      onChange={(e) => rhfField.onChange(e)}
      onBlur={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      readOnly={field.readonly}
      className="w-full"
    />
  )
}