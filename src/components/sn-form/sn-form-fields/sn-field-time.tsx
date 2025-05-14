import { RHFField } from "../../../types/form-schema"
import { Input } from "../../../components/ui/input"
import { useFieldUI } from "../contexts/FieldUIContext"

interface SnFieldTimeProps {
  rhfField: RHFField
  onChange: (val: string) => void
  onFocus?: () => void
}

export function SnFieldTime({ rhfField, onChange, onFocus }: SnFieldTimeProps) {
  const { readonly } = useFieldUI()

  return (
    <Input
      {...rhfField}
      type="time"
      value={String(rhfField.value ?? "")}
      onChange={(e) => rhfField.onChange(e)}
      onFocus={onFocus}
      onBlur={(e) => onChange(e.target.value)}
      disabled={!!readonly}
      className="w-full"
    />
  )
}
