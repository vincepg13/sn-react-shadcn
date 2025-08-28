import { X } from 'lucide-react'
import { useFieldUI } from '../contexts/FieldUIContext'
import { SnFieldSchema, SnFieldBaseProps } from '../../../types/form-schema'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'

interface SnFieldChoiceProps extends Omit<SnFieldBaseProps<string>, 'field'> {
  field: SnFieldSchema
}

export function SnFieldChoice({ field, rhfField, onChange }: SnFieldChoiceProps) {
  const { readonly } = useFieldUI()

  const handleValueChange = (val: string) => {
    const display = field.choices?.find(choice => choice.value === val)?.label ?? ''
    onChange(val, display)
  }
  return (
    <div className="relative w-full">
      {typeof rhfField.value !== 'undefined' && (
        <Select value={rhfField.value + ''} onValueChange={handleValueChange} disabled={readonly}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="-- Select Option --" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{field.label}</SelectLabel>
              {field
                .choices!.filter(c => !!c.value)
                .map(choice => (
                  <SelectItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </SelectItem>
                ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      {/* Clear button */}
      {rhfField.value && !readonly && (
        <X
          className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-destructive"
          onClick={() => onChange('')}
        />
      )}
    </div>
  )
}
