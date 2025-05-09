import { useFormContext } from 'react-hook-form'
import { SnFieldDate } from './sn-field-date'
import { SnFieldInput } from './sn-field-input'
import { SnFieldChoice } from './sn-field-choice'
import { SnFieldNumeric } from './SnFieldNumeric'
import { SnFieldTextarea } from './sn-field-textarea'
import { SnFieldCheckbox } from './sn-field-checkbox'
import { ReactNode, useRef, useCallback } from 'react'
import { SnFieldReference } from './sn-field-reference'
import { FieldUIContext } from '../contexts/FieldUIContext'
import { useEffectiveFieldState } from '../hooks/useFieldUiState'
import { useClientScripts } from '../contexts/SnClientScriptContext'
import { useUiPoliciesContext } from '../contexts/SnUiPolicyContext'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/form'
import { SnFieldSchema, RHFField, FieldUIState, SnFieldPrimitive } from '../../../types/form-schema'

interface SnFieldProps {
  field: SnFieldSchema
  fieldUIState: Record<string, FieldUIState>
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void
  table: string
  guid: string
}

function SnFieldComponent({ field, fieldUIState, guid, table }: SnFieldProps) {
  const { control, getValues, setValue } = useFormContext()
  const { runClientScriptsForFieldChange, fieldChangeHandlers } = useClientScripts()
  const { runUiPoliciesForField } = useUiPoliciesContext()

  const oldValueRef = useRef<SnFieldPrimitive>(field.value)

  const fieldUI = useEffectiveFieldState({
    field,
    uiState: fieldUIState,
    fieldVal: String(getValues()[field.name]),
  })

  const handleChange = useCallback(
    (newValue: SnFieldPrimitive) => {
      setValue(field.name, newValue, { shouldDirty: true, shouldTouch: true })
      runClientScriptsForFieldChange(field.name, oldValueRef.current, newValue, false)
      runUiPoliciesForField(field.name)
      oldValueRef.current = newValue
    },
    [field.name, setValue, runClientScriptsForFieldChange, runUiPoliciesForField]
  )

  fieldChangeHandlers[field.name] = handleChange

  if (!fieldUI.visible) return null

  return (
    <FieldUIContext.Provider value={fieldUI}>
      <FormField
        name={field.name}
        control={control}
        render={({ field: rhfField }) => {
          const handleFocus = () => {}

          const input = renderFieldComponent(table, guid, field, rhfField, handleChange, handleFocus, getValues())

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
  table: string,
  guid: string,
  field: SnFieldSchema,
  rhfField: RHFField,
  handleChange: (value: SnFieldPrimitive) => void,
  handleFocus: () => void,
  formValues: Record<string, string>
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
    case 'reference':
    case 'glide_list':
      return (
        <SnFieldReference
          field={field}
          table={table}
          recordSysId={guid}
          formValues={formValues}
          onChange={handleChange}
        />
      )
    case 'glide_date':
    case 'glide_date_time':
      return <SnFieldDate field={field} rhfField={rhfField} onChange={handleChange} />
    case 'integer':
    case 'float':
    case 'decimal':
      return (
        <SnFieldNumeric
          value={rhfField.value as number}
          onValueChange={value => handleChange(value ?? '')}
          onFocus={handleFocus}
          thousandSeparator=","
          decimalScale={field.type === 'float' || field.type === 'decimal' ? 2 : 0}
          fixedDecimalScale={field.type === 'decimal'}
        />
      )
    default:
      return null
  }
}

export const SnField = SnFieldComponent
