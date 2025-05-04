import { Input } from '../../components/ui/input'
import { SnFieldSchema, RHFField } from '../../types/form-schema'

interface SnFieldInputProps {
  field: SnFieldSchema
  rhfField: RHFField
}

export function SnFieldInput({ field, rhfField }: SnFieldInputProps) {
  return <Input {...rhfField} readOnly={field.readonly} value={(rhfField.value ?? '') + ''} className="w-full"/>
}
