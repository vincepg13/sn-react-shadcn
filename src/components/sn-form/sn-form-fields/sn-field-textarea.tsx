import { SnFieldSchema, RHFField } from '../../../types/form-schema'
import { Textarea } from '../../ui/textarea'
import { useFieldUI } from '../contexts/FieldUIContext'

interface SnFieldTextareaProps {
  field: SnFieldSchema
  rhfField: RHFField
  onChange: (val: string) => void
  onFocus: () => void
}

export function SnFieldTextarea({ rhfField, onChange, onFocus }: SnFieldTextareaProps) {
  const { readonly } = useFieldUI()

  return (
    <Textarea
      {...rhfField}
      value={String(rhfField.value ?? '')}
      onChange={e => rhfField.onChange(e)}
      onBlur={e => onChange(e.target.value)}
      onFocus={onFocus}
      disabled={readonly}
      className="w-full max-h-[450px]"
    />
  )
}
