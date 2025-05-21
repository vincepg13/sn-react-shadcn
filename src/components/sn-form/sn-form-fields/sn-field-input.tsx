import { RHFField } from "../../../types/form-schema"
import { Input } from "../../../components/ui/input"
import { useFieldUI } from "../contexts/FieldUIContext"
import { memo } from "react"

interface SnFieldInputProps {
  rhfField: RHFField
  onChange: (val: string) => void
  onFocus: () => void
}

export const SnFieldInput = memo(function SnFieldInput({ rhfField, onChange, onFocus }: SnFieldInputProps) {
  const { readonly } = useFieldUI()
  return (
    <Input
      {...rhfField}
      value={String(rhfField.value ?? '')}
      onFocus={onFocus}
      onBlur={(e) => onChange(e.target.value)}
      disabled={!!readonly}
      className="w-full"
    />
  )
})