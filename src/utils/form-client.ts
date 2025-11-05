/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefObject } from 'react'
import { SnConditionMap } from '@kit/types/condition-schema'
import { getDotwalkedValues, postFormAction } from './form-api'
import { toSafe } from './../components/sn-form/hooks/useDotSafeForm'
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

export function choicesToTableMap(table: string, choices: SnFieldSchema['choices']): Record<string, SnConditionMap> {
  const reducedToObj = choices!.reduce((acc, choice) => {
    acc[choice.name!] = {
      name: choice.name!,
      label: choice.label,
      type: choice.type!,
      reference: choice.reference || '',
      operators: [],
    }
    return acc
  }, {} as SnConditionMap)

  return { [table]: reducedToObj }
}

export function buildSubmissionPayload(formFields: SnFieldsSchema, values: Record<string, any>): Record<string, any> {
  const payload = Object.fromEntries(
    Object.entries(formFields).map(([name, field]) => {
      const payloadField = {
        ...field,
        value: String(values[toSafe(name)] || ''),
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

export async function linkRefFieldDotWalks(
  type: string,
  name: string,
  refTable: string,
  fieldList: string[],
  newValue: string,
  setValue: any,
  displayValues: RefObject<Record<string, string>>,
  toSafe: (name: string) => string,
  controllerRef: RefObject<AbortController>
) {
  if (type === 'reference') {
    const walkedFields = fieldList.filter(f => f.startsWith(`${name}.`)).map(f => f.replace(`${name}.`, ''))

    if (walkedFields.length > 0) {
      controllerRef.current.abort()
      controllerRef.current = new AbortController()

      const walkedValues = await getDotwalkedValues(refTable, String(newValue), walkedFields, controllerRef.current)
      if (walkedValues) {
        Object.entries(walkedValues).forEach(([dotField, valPair]) => {
          const safeName = toSafe(`${name}.${dotField}`)
          setValue(safeName, valPair.value)
          displayValues.current[safeName] = valPair.displayValue
        })
      }
    }
  }
}
