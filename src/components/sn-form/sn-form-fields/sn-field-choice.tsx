import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { X } from 'lucide-react';
import { SnFieldSchema, RHFField } from '../../../types/form-schema';
import { useRef } from 'react';
import { useFieldUI } from "../contexts/FieldUIContext"

interface SnFieldChoiceProps {
  field: SnFieldSchema;
  rhfField: RHFField;
  onChange: (val: string) => void;
}

export function SnFieldChoice({ field, rhfField, onChange }: SnFieldChoiceProps) {
  const didMount = useRef(false)
  const { readonly } = useFieldUI()

  const handleValueChange = (val: string) => {
    if (!didMount.current) {
      didMount.current = true
      return
    }

    onChange(val)
  }
  return (
    <div className="relative w-full">
      <Select
        value={(rhfField.value ?? '') + ''}
        onValueChange={handleValueChange}
        disabled={readonly}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="-- Select Option --" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{field.label}</SelectLabel>
            {field.choices!
              .filter(c => !!c.value)
              .map(choice => (
                <SelectItem key={choice.value} value={choice.value}>
                  {choice.label}
                </SelectItem>
              ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Clear button */}
      {rhfField.value && (
        <X
          className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-destructive"
          onClick={() => onChange('')}
        />
      )}
    </div>
  );
}
