import { SnFieldBaseProps } from '../../../types/form-schema';
import { Checkbox } from '../../../components/ui/checkbox';
import { useFieldUI } from '../contexts/FieldUIContext';

export function SnFieldCheckbox({ field, rhfField, onChange }: SnFieldBaseProps<string|boolean>) {
  const { readonly } = useFieldUI();
  if (!field) return null;

  return (
    <div className="flex items-center space-x-2 min-h-[60px]">
      <Checkbox
        id={field.name}
        checked={rhfField.value === true || rhfField.value === 'true'}
        onCheckedChange={(val) => onChange(val === true)} 
        disabled={!!readonly}
      />
      <label
        htmlFor={field.name}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {field.label}
      </label>
    </div>
  );
}
