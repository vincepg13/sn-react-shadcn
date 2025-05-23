import { RHFField } from "../../../types/form-schema"
import { Input } from "../../../components/ui/input"
import { useFieldUI } from "../contexts/FieldUIContext"
import { memo } from "react"

interface SnFieldInputProps {
  rhfField: RHFField
  onChange: (val: string) => void
  onFocus: () => void
  type?: string
}

export const SnFieldInput = memo(function SnFieldInput({ rhfField, onChange, onFocus, type="text" }: SnFieldInputProps) {
  const { readonly } = useFieldUI()
  let dv = String(rhfField.value ?? '')

  if (type === 'password') {
    dv = dv.substring(0, 10)
  }

  return (
    <Input
      {...rhfField}
      value={dv}
      onFocus={onFocus}
      onBlur={(e) => onChange(e.target.value)}
      disabled={!!readonly}
      className="w-full"
      type={type}
    />
  )
})