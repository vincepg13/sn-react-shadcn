import { ReactNode, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { SnFieldSchema, RHFField, FieldUIState } from '../../../types/form-schema'
import { SnFieldInput } from './sn-field-input'
import { SnFieldTextarea } from './sn-field-textarea'
import { SnFieldChoice } from './sn-field-choice'
import { useClientScripts } from '../contexts/SnClientScriptContext'
import { useUiPoliciesContext } from '../contexts/SnUiPolicyContext'
import { createGFormBridge } from '../../../utils/form-client'
import { FieldUIContext } from '../contexts/FieldUIContext'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/form'
import { useEffectiveFieldState } from '../hooks/useFieldUiState'
import { SnFieldCheckbox } from './sn-field-checkbox'
import { SnFieldDate } from './sn-field-date'

interface SnFieldProps {
  field: SnFieldSchema
  fieldUIState: Record<string, FieldUIState>
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void
  table?: string
  guid?: string
}

type SnFieldPrimitive = string | boolean | number

function SnFieldComponent({ field, fieldUIState, updateFieldUI, guid, table }: SnFieldProps) {
  const { control, getValues, setValue/*, watch */} = useFormContext()
  const { runClientScriptsForFieldChange } = useClientScripts()
  const { runUiPoliciesForField } = useUiPoliciesContext()
  const oldValueRef = useRef<SnFieldPrimitive>(field.value)

  const fieldUI = useEffectiveFieldState({
    field,
    uiState: fieldUIState,
  })

  if (!fieldUI.visible) return null

  return (
    <FieldUIContext.Provider value={fieldUI}>
      <FormField
        name={field.name}
        control={control}
        render={({ field: rhfField }) => {
          const handleFocus = () => {
            //oldValueRef.current = getValues()[field.name]
          }

          const handleChange = (newValue: SnFieldPrimitive) => {
            console.log("SN FIELD CHANGE", field.name, typeof newValue)
            // if (oldValueRef.current === undefined) {
            //   oldValueRef.current = getValues()[field.name]
            // }
            // const oldValue = oldValueRef.current
            rhfField.onChange(newValue)

            const g_form = createGFormBridge(getValues, setValue, updateFieldUI, table, guid)
            runClientScriptsForFieldChange(field.name, oldValueRef.current, newValue, false, g_form)
            runUiPoliciesForField(field.name)
            oldValueRef.current = newValue
          }

          const input = renderFieldComponent(field, rhfField, handleChange, handleFocus)
          if (!input) return <></>

          return (
            <FormItem className="mb-4">
              {field.type !== 'boolean' && (
                <FormLabel>
                  <span>
                    {field.label} {fieldUI.mandatory && <span className="text-red-500">*</span>}
                  </span>
                </FormLabel>
              )}
              <FormControl>{input}</FormControl>
              <FormMessage />
            </FormItem>
          )
        }}
      />
    </FieldUIContext.Provider>
  )
}

function renderFieldComponent(
  field: SnFieldSchema,
  rhfField: RHFField,
  handleChange: (value: string | boolean) => void,
  handleFocus: () => void
): ReactNode {
  switch (field.type) {
    case 'string':
      if (field.max_length && field.max_length >= 200) {
        return <SnFieldTextarea field={field} rhfField={rhfField} onChange={handleChange} onFocus={handleFocus} />
      }
      return <SnFieldInput rhfField={rhfField} onChange={handleChange} onFocus={handleFocus} />
    case 'choice':
      return <SnFieldChoice field={field} rhfField={rhfField} onChange={handleChange} />
    case 'boolean':
      return <SnFieldCheckbox field={field} rhfField={rhfField} onChange={handleChange} />
    case 'glide_date':
    case 'glide_date_time':
      return <SnFieldDate field={field} rhfField={rhfField} onChange={handleChange} />
    default:
      return null
  }
}

export const SnField = SnFieldComponent
