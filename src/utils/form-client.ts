/* eslint-disable @typescript-eslint/no-explicit-any */
import { postFormAction } from './form-api'
import { FieldUIState, SnFieldSchema, SnFieldsSchema } from '../types/form-schema'

export function formatSectionName(input: string): string {
  let cleaned = input.replace(/[^a-zA-Z0-9 ]+/g, '')
  cleaned = cleaned.toLowerCase()

  const firstSpaceIndex = cleaned.indexOf(' ')
  if (firstSpaceIndex !== -1)
    cleaned = cleaned.slice(0, firstSpaceIndex) + '_' + cleaned.slice(firstSpaceIndex + 1).replace(/ /g, '')

  return cleaned
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

export function buildSubmissionPayload(formFields: SnFieldsSchema, values: Record<string, any>): Record<string, any> {
  const payload = Object.fromEntries(
    Object.entries(formFields).map(([name, field]) => {
      const payloadField = {
        ...field,
        value: String(values[name] || ''),
      }

      if (payloadField.type === 'journal_input' && payloadField.value) {
        payloadField.journalInputChanged = true
      }

      return [name, payloadField]
    })
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

export function computeEffectiveFieldState(
  field: SnFieldSchema | undefined,
  fieldVal: unknown,
  override: Partial<FieldUIState> | undefined
): FieldUIState {
  const sysRo = !!field?.sys_readonly
  const ro = (override?.readonly ?? field?.readonly ?? false) as boolean
  const man = (override?.mandatory ?? field?.mandatory ?? false) as boolean
  const visible = (override?.visible ?? field?.visible ?? true) as boolean

  return {
    readonly: sysRo ? true : ro && !!(fieldVal || !man),
    mandatory: sysRo ? false : man,
    visible,
  }
}
