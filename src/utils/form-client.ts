/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefObject } from 'react'
import { FieldUIState, SnFieldSchema, SnFieldsSchema, SnSection } from '../types/form-schema'
import { postFormAction } from './form-api'
import { toast } from 'sonner'

function formatSectionName(input: string): string {
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

export function createGFormBridge(
  formFields: SnFieldsSchema,
  getValues: () => any,
  setValue: (field: string, value: any) => void,
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void,
  fieldChangeHandlers: RefObject<Record<string, (value: any) => void>>,
  sections: SnSection[],
  displayValues: RefObject<Record<string, string>>,
  table?: string,
  guid?: string
) {
  console.log('Creating GForm bridge', { formFields, sections, table, guid })
  return {
    getValue: (field: string) => getValues()[field],
    getDisplayValue: (field: string) => displayValues.current[field],
    getTableName: () => table,
    getBooleanValue: (field: string) => getValues()[field] === true || getValues()[field] === 'true',
    setReadOnly: (field: string, state: boolean) => updateFieldUI(field, { readonly: state }),
    setDisabled: (field: string) => updateFieldUI(field, { readonly: true }),
    setDisplay: (field: string, state: boolean) => updateFieldUI(field, { visible: state }),
    setVisible: (field: string, state: boolean) => updateFieldUI(field, { visible: state }),
    setMandatory: (field: string, state: boolean) => updateFieldUI(field, { mandatory: state }),
    clearValue: (field: string) => setValue(field, ''),
    isNewRecord: () => !guid || guid === '-1' || guid === '',
    getIntValue: (field: string) => parseInt(getValues()[field]),
    getDecimalValue: (field: string) => parseFloat(getValues()[field]),

    getSectionNames: () => sections.map(s => formatSectionName(s.caption!)),
    setSectionDisplay: (sectionName: string, state: boolean) => {
      const section = sections.find(s => formatSectionName(s.caption!) === sectionName)
      if (section) section.visible = state
    },

    addOption: (fieldName: string, choiceValue: string, choiceLabel: string, choiceIndex?: number) => {
      const field = formFields[fieldName]
      if (!field || !field.choices) return

      const newChoice = { value: choiceValue, label: choiceLabel }
      const exists =
        field.choices.some(choice => choice.value === choiceValue) ||
        field.choices.some(choice => choice.label === choiceLabel)
      if (exists) return

      if (choiceIndex !== undefined) {
        field.choices.splice(choiceIndex, 0, newChoice)
      } else {
        field.choices.push(newChoice)
      }
    },

    removeOption: (fieldName: string, choiceValue: string) => {
      const field = formFields[fieldName]
      if (!field || !field.choices) return

      if (getValues()[fieldName] === choiceValue) {
        setValue(fieldName, '')
      }

      field.choices = field.choices.filter(choice => choice.value !== choiceValue)
    },

    clearOptions: (fieldName: string) => {
      const field = formFields[fieldName]
      if (!field || !field.choices) return
      field.choices = field.choices.filter(choice => choice.value === '')
    },

    addErrorMessage: (message: string) => {
      toast.error(message, { duration: 20000 })
    },
    addInfoMessage: (message: string) => {
      toast.info(message, { duration: 5000 })
    },

    setValue: (fieldName: string, value: any) => {
      setValue(fieldName, value)
      const handlers = fieldChangeHandlers.current

      if (handlers?.[fieldName]) {
        handlers[fieldName](value)
      }
    },

    //Unsupported methods
    flash() {
      console.warn('GForm flash method is not supported in React')
    },
    addDecoration() {
      console.warn('GForm addDecoration method is not supported in React')
    },
    getControl() {
      console.error('GForm getControl method is not supported in React. Use of this method may cause scripts to fail.')
      return null
    },
    getElement() {
      console.error('GForm getElement method is not supported in React. Use of this method may cause scripts to fail.')
      return null
    },
    getSections() {
      console.error('GForm getSections method is not supported in React. Use of this method may cause scripts to fail.')
      return null
    },
    getHelpTextControl() {
      console.warn('GForm getHelpTextControl method is not supported in React')
    },
    showFieldMsg() {
      console.warn('GForm showFieldMsg method is not supported in React')
    },
    hideFieldMsg() {
      console.warn('GForm hideFieldMsg method is not supported in React')
    },
    showErrorBox() {
      console.warn('GForm showErrorBox method is not supported in React')
    },
    removeDecoration() {
      console.warn('GForm removeDecoration method is not supported in React')
    },
    showRelatedList() {
      console.warn('GForm showRelatedList method is not supported in React')
    },
    hideRelatedList() {
      console.warn('GForm hideRelatedList method is not supported in React')
    },
    showRelatedLists() {
      console.warn('GForm showRelatedLists method is not supported in React')
    },
    hideRelatedLists() {
      console.warn('GForm hideRelatedLists method is not supported in React')
    },
    isSectionVisible() {
      console.warn('GForm isSectionVisible method is not supported in React')
    },
    getViewName() {
      console.warn('GForm getViewName method is not supported in React')
    },
    getUniqueValue() {
      console.warn('GForm getUniqueValue method is not supported in React')
    },
    getSysId() {
      console.warn('GForm getSysId method is not supported in React')
    },
    getFormElement() {
      console.warn('GForm getFormElement method is not supported in React')
    },
    getActionName() {
      console.warn('GForm getActionName method is not supported in React')
    },
    save() {
      console.warn('GForm save method is not supported in React')
    },
    submit() {
      console.warn('GForm submit method is not supported in React')
    },
    clearMessages() {
      console.warn('GForm clearMessages method is not supported in React')
    },
    getFieldNames() {
      console.warn('GForm getFieldNames method is not supported in React')
    },
    hasField() {
      console.warn('GForm hasField method is not supported in React')
    },
    validate() {
      console.warn('GForm validate method is not supported in React')
    },
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
