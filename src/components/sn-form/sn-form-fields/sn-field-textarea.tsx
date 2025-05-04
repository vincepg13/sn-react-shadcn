import { SnFieldSchema, RHFField } from '../../../types/form-schema';
import { Textarea } from '../../ui/textarea';

interface SnFieldTextareaProps {
  field: SnFieldSchema;
  rhfField: RHFField;
  onChange: (val: string) => void;
}

export function SnFieldTextarea({ field, rhfField, onChange }: SnFieldTextareaProps) {
  return (
    <Textarea
      {...rhfField}
      value={String(rhfField.value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      readOnly={field.readonly}
      className="w-full"
    />
  );
}
