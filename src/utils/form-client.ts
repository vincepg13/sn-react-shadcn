/* eslint-disable @typescript-eslint/no-explicit-any */
import { z, ZodTypeAny } from 'zod'
import { FieldUIState, SnFieldSchema, SnFieldsSchema } from '../types/form-schema'
import { postFormAction } from './form-api'
import { toast } from 'sonner'

export function mapFieldToZod(field: SnFieldSchema): ZodTypeAny {
  let base: ZodTypeAny

  switch (field.type) {
    case 'string':
      base = z.string()
      if (field.max_length && base instanceof z.ZodString) {
        base = base.max(field.max_length)
      }
      break
    case 'choice':
      base = z.enum(field.choices!.map(c => c.value) as [string, ...string[]])
      break
    case 'boolean':
      base = z.boolean()
      break
    case 'glide_date':
    case 'glide_date_time':
      base = z.string().refine(val => /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: 'Invalid date format',
      })
      break
    default:
      base = z.any()
  }

  if (field.type === 'string' && field.mandatory) {
    base = z.string().min(1, ``)
  }

  return field.mandatory ? base : base.optional()
}

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
  table?: string,
  guid?: string
) {
  return {
    getValue: (field: string) => getValues()[field],
    getTableName: () => table,
    getBooleanValue: (field: string) => getValues()[field] === true || getValues()[field] === 'true',
    setValue: (field: string, value: any) => setValue(field, value),
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
  }
}

export function buildSubmissionPayload(formFields: SnFieldsSchema, values: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(formFields).map(([name, field]) => [
      name,
      {
        ...field,
        value: values[name],
      },
    ])
  )
}

export async function triggerNativeUIAction({
  table,
  recordID,
  actionSysId,
  data,
}: {
  table: string
  recordID: string
  actionSysId: string
  data: SnFieldsSchema
}) {
  const res = await postFormAction(table, recordID, actionSysId, data)
  const result = res.data
  if (res.status !== 201) {
    throw new Error(result?.error?.message || 'UI Action failed')
  }

  return result
}
