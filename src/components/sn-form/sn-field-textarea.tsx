import { SnFieldSchema, RHFField } from '../../types/form-schema'
import { Textarea } from '../ui/textarea'

interface SnFieldInputProps {
  field: SnFieldSchema
  rhfField: RHFField
}

export function SnFieldTextarea({ field, rhfField }: SnFieldInputProps) {
  return <Textarea {...rhfField} readOnly={field.readonly} value={(rhfField.value ?? '') + ''} />
}
