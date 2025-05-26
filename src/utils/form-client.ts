/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefObject } from 'react'
import { FieldUIState, SnFieldSchema, SnFieldsSchema } from '../types/form-schema'
import { postFormAction } from './form-api'
import { toast } from 'sonner'

export function getDefaultValue(field: SnFieldSchema) {
  if (field.value !== undefined && field.value !== null) return field.value
  switch (field.type) {
    case 'boolean':
      return false
    case 'string':
    case 'choice':
      return ''
    default:
      return null
  }
}

export function createGFormBridge(
  getValues: () => any,
  setValue: (field: string, value: any) => void,
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void,
  fieldChangeHandlers: RefObject<Record<string, (value: any) => void>>,
  table?: string,
  guid?: string,
) {
  return {
    getValue: (field: string) => getValues()[field],
    getTableName: () => table,
    getBooleanValue: (field: string) => getValues()[field] === true || getValues()[field] === 'true',
    setReadOnly: (field: string, state: boolean) => updateFieldUI(field, { readonly: state }),
    setDisplay: (field: string, state: boolean) => updateFieldUI(field, { visible: state }),
    setVisible: (field: string, state: boolean) => updateFieldUI(field, { visible: state }),
    setMandatory: (field: string, state: boolean) => updateFieldUI(field, { mandatory: state }),
    clearValue: (field: string) => setValue(field, ''),
    isNewRecord: () => !guid || guid === '-1' || guid === '',

    addErrorMessage: (message: string) => {
      toast.error(message, { duration: 20000 })
    },
    addInfoMessage: (message: string) => {
      toast.info(message, { duration: 5000 })
    },

    setValue(fieldName: string, value: any) {
      setValue(fieldName, value);
      const handlers = fieldChangeHandlers.current;

      if (handlers?.[fieldName]) {
        handlers[fieldName](value);
      }
    },
  }
}

export function buildSubmissionPayload(formFields: SnFieldsSchema, values: Record<string, any>): Record<string, any> {
  const payload = Object.fromEntries(
    Object.entries(formFields).map(([name, field]) => [
      name,
      {
        ...field,
        value: String(values[name] || ''),
      },
    ])
  )

  return payload
}

export async function triggerNativeUIAction({
  table,
  recordID,
  attachmentGuid,
  actionSysId,
  data,
}: {
  table: string
  recordID: string
  actionSysId: string
  attachmentGuid: string
  data: SnFieldsSchema
}) {
  const res = await postFormAction(table, recordID, attachmentGuid, actionSysId, data)
  const result = res.data
  if (res.status !== 201) {
    throw new Error(result?.error?.message || 'UI Action failed')
  }

  return result
}
