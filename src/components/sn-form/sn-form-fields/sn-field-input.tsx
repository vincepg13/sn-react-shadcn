import { RHFField } from "../../../types/form-schema";
import { Input } from "../../../components/ui/input";
import { useFieldUI } from "../contexts/FieldUIContext";

interface SnFieldInputProps {
  rhfField: RHFField;
  onChange: (val: string) => void;
}

export function SnFieldInput({ rhfField, onChange }: SnFieldInputProps) {
  const { readonly } = useFieldUI();

  return (
    <Input
      {...rhfField}
      value={String(rhfField.value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      disabled={!!readonly}
      className="w-full"
    />
  );
}
