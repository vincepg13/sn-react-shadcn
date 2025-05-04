/* eslint-disable @typescript-eslint/no-explicit-any */
// import { SnFieldBoolean } from "./sn-field-boolean";
// import { SnFieldChoice } from "./sn-field-choice";

import React from 'react'
// import isEqual from "lodash.isequal";
import { useFormContext } from 'react-hook-form'
import { SnFieldSchema, RHFField, FieldUIState } from '../../../types/form-schema'
import { SnFieldInput } from './sn-field-input'
import { SnFieldTextarea } from './sn-field-textarea'
import { SnFieldChoice } from './sn-field-select'
import { useClientScripts } from '../contexts/SnClientScriptContext'
import { createGFormBridge } from '../../../utils/form-client'
import { FieldUIContext } from '../contexts/FieldUIContext'

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/form'
import { useEffectiveFieldState } from '../hooks/useFieldUiState'
import { SnFieldCheckbox } from './sn-field-checkbox'
import { SnFieldDate } from './sn-field-data'

interface SnFieldProps {
  field: SnFieldSchema
  fieldUIState: Record<string, FieldUIState>
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void
  table?: string
  guid?: string
}

function SnFieldComponent({ field, fieldUIState, updateFieldUI, guid, table }: SnFieldProps) {
  const { control, getValues, setValue } = useFormContext()
  const { runClientScriptsForFieldChange } = useClientScripts()
  const [hasInitialized, setHasInitialized] = React.useState(false)

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
          const handleChange = (newValue: string) => {
            const oldValue = getValues()[field.name]
            rhfField.onChange(newValue)

            if (!hasInitialized) {
              setHasInitialized(true)
              return
            }

            if (newValue !== oldValue) {
              const g_form = createGFormBridge(getValues, setValue, updateFieldUI, table, guid)
              runClientScriptsForFieldChange(field.name, oldValue, newValue, false, g_form)
            }
          }

          const input = renderFieldComponent(field, rhfField, handleChange)
          if (!input) return <></>
          return (
            <FormItem className="mb-4">
              {field.type != 'boolean' && (
                <FormLabel>
                  {field.label} {fieldUI.mandatory && <span>M!!</span>}
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
  handleChange: (value: any) => void
): React.ReactNode {
  switch (field.type) {
    case 'string':
      if (field.max_length && field.max_length >= 200) {
        return <SnFieldTextarea field={field} rhfField={rhfField} onChange={handleChange} />
      }
      return <SnFieldInput rhfField={rhfField} onChange={handleChange} />
    case 'choice':
      return <SnFieldChoice field={field} rhfField={rhfField} onChange={handleChange} />
    case 'boolean':
      return <SnFieldCheckbox field={field} rhfField={rhfField} onChange={handleChange} />
    case 'glide_date':
    case 'glide_date_time':
      return <SnFieldDate field={field} rhfField={rhfField} onChange={handleChange} />
    default:
      // console.log(`Unsupported field type: ${field.type}`);
      return null
  }
}

// export const SnField = React.memo(SnFieldComponent, (prev, next) =>
//   isEqual(prev.field, next.field)
// );

export const SnField = SnFieldComponent
