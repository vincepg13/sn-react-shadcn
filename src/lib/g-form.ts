/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'sonner'
import { RefObject } from 'react'
import { GlideAjax } from './glide-ajax'
import { formatSectionName } from '@kit/utils/form-client'
import { parseAjaxGlideRecord } from '@kit/utils/xml-parser'
import { FieldUIState, SnFieldsSchema, SnSection } from '../types/form-schema'

const refCache = new Map<string, any>()

export function createGFormBridge(
  formFields: SnFieldsSchema,
  getValues: () => any,
  setValue: (field: string, value: any) => void,
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void,
  fieldChangeHandlers: RefObject<Record<string, (value: any) => void>>,
  sections: SnSection[],
  displayValues: RefObject<Record<string, string>>,
  scope: string,
  view: string,
  table?: string,
  guid?: string
) {
  const base: Record<string, any> = {
    getValue: (field: string) => getValues()[field],
    getDisplayValue: (field: string) => displayValues.current[field],
    getUniqueValue: () => guid || '-1',
    getTableName: () => table,
    getViewName: () => view,
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

    async getReference(fieldName: string, cb: (obj: any) => void) {
      try {
        const field = formFields[fieldName]
        if (!field || field.type !== 'reference') return cb(null)

        const sys_id: string = getValues()[fieldName]
        if (!sys_id) return cb(null)

        const table: string = field.ed!.reference
        if (!table) return cb(null)

        const cacheKey = `${table}:${sys_id}`
        if (refCache.has(cacheKey)) return cb(refCache.get(cacheKey))

        const ga = new GlideAjax('AJAXGlideRecord')
        ga.addParam('sysparm_name', table)
          .addParam('sysparm_scope', scope)
          .addParam('sysparm_type', 'query')
          .addParam('sysparm_chars', `sys_id=${sys_id}`)

        const xml = await ga.getXML()
        const record = parseAjaxGlideRecord(xml)

        if (record) refCache.set(cacheKey, record)
        cb(record ?? null)
      } catch (e) {
        console.error('[g_form.getReference] failed', e)
        cb(null)
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

  //Warn on any other unsupported methods instead of erroring
  const warned = new Set<string>()
  const proxy = new Proxy(base, {
    get(target, prop, receiver) {
      if (typeof prop !== 'string') return Reflect.get(target, prop, receiver)

      const val = Reflect.get(target, prop, receiver)
      if (typeof val !== 'undefined') return typeof val === 'function' ? val.bind(target) : val

      return (...args: any[]) => {
        if (!warned.has(prop)) {
          console.warn(`g_form.${prop} is not supported in React (called with:`, args, ')')
          warned.add(prop)
        }

        return undefined
      }
    },
  })

  return proxy as any
}
