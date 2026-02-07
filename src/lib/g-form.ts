/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'sonner'
import { RefObject } from 'react'
import { GlideAjax } from './glide-ajax'
import { htmlToReact } from '@kit/utils/html-parser'
import { parseAjaxGlideRecord } from '@kit/utils/xml-parser'
import { isSupportedSnDecorationIcon } from '@kit/utils/decoration-icons'
import { computeEffectiveFieldState, formatSectionName } from '@kit/utils/form-client'
import {
  FieldDecoration,
  FieldMessage,
  FieldMessageType,
  SnDecorationIcon,
  FieldUIState,
  SnFieldsSchema,
  SnSection,
  SnUiAction,
  UiActionHandler,
} from '../types/form-schema'

const refCache = new Map<string, any>()
let _actionName = ''

export function setActionName(name: string) {
  _actionName = name
}

interface GFormBridgeOptions {
  formFieldsRef: RefObject<SnFieldsSchema>
  getValues: () => any
  setValue: (field: string, value: string, opts?: any) => void
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void
  fieldChangeHandlers: RefObject<Record<string, (value: any) => void>>
  sectionsRef: RefObject<SnSection[]>
  displayValuesRef: RefObject<Record<string, string>>
  fieldUIStateRef: RefObject<Record<string, FieldUIState>>
  scope: string
  view: string
  table?: string
  guid?: string
  uiActions: SnUiAction[]
  uiActionHandlerRef: RefObject<UiActionHandler | undefined>
}

export function createGFormBridge(opts: GFormBridgeOptions) {
  const {
    formFieldsRef,
    getValues,
    setValue,
    updateFieldUI,
    fieldChangeHandlers,
    sectionsRef,
    displayValuesRef,
    fieldUIStateRef,
    scope,
    view,
    table,
    guid,
    uiActions,
    uiActionHandlerRef,
  } = opts
  const _uniqueValue = guid || '-1'

  // Ref deref helpers (always read the latest snapshot)
  const getFormFields = () => formFieldsRef.current ?? ({} as SnFieldsSchema)
  const getSections = () => sectionsRef.current ?? ([] as SnSection[])
  const getDisplayValues = () => displayValuesRef.current ?? ({} as Record<string, string>)
  const getUIState = () => fieldUIStateRef.current ?? ({} as Record<string, FieldUIState>)

  const _getLabel = (fieldName: string) => getFormFields()[fieldName]?.label || ''
  const _setLabel = (fieldName: string, label: string) => {
    const fields = getFormFields()
    if (fields[fieldName]) fields[fieldName].label = label
  }

  const getFieldUIState = (fieldName: string): FieldUIState => {
    const fields = getFormFields()
    const overrides = getUIState()
    const def = fields[fieldName]
    const val = base.getValue(fieldName)
    return computeEffectiveFieldState(def, val, overrides[fieldName])
  }

  const clientSubmit = (actionName: string) => {
    const fn = uiActionHandlerRef.current
    const action = uiActions.find(a => a.action_name === actionName)
    if (action && fn) return fn(action)

    console.warn(`g_form.save: no handler or action found for ${actionName}`)
  }

  const normalizeFieldMsgType = (type?: string): FieldMessageType => {
    if (!type) return 'info'
    const normalized = type.toLowerCase()
    if (normalized === 'warning' || normalized === 'warn') return 'warning'
    if (normalized === 'error' || normalized === 'err') return 'error'
    return 'info'
  }

  const setFieldMessages = (fieldName: string, fieldMsgs: FieldMessage[]) => {
    const uiState = getUIState()
    fieldUIStateRef.current = {
      ...uiState,
      [fieldName]: {
        ...(uiState[fieldName] ?? {}),
        fieldMsgs,
      },
    }
    updateFieldUI(fieldName, { fieldMsgs })
  }

  const setFieldDecoration = (fieldName: string, decoration?: FieldDecoration) => {
    const uiState = getUIState()
    fieldUIStateRef.current = {
      ...uiState,
      [fieldName]: {
        ...(uiState[fieldName] ?? {}),
        decoration,
      },
    }
    updateFieldUI(fieldName, { decoration })
  }

  const base: Record<string, any> = {
    // Meta
    getViewName: () => view,
    getTableName: () => table,
    getSysId: () => _uniqueValue,
    getUniqueValue: () => _uniqueValue,
    isNewRecord: () => !guid || guid === '-1' || guid === '',

    // Field presence
    hasField: (fieldName: string) => !!getFormFields()[fieldName],
    getFieldNames: () => Object.keys(getFormFields()),

    // Value accessors
    getDisplayValue: (field: string) => getDisplayValues()[field] ?? '',
    getValue: (field: string) => {
      const vals = getValues() || {}
      return String(vals[field] ?? '')
    },
    getIntValue: (field: string) => {
      const v = base.getValue(field)
      const n = parseInt(v, 10)
      return Number.isNaN(n) ? undefined : n
    },
    getDecimalValue: (field: string) => {
      const v = base.getValue(field)
      const n = parseFloat(v)
      return Number.isNaN(n) ? undefined : n
    },
    getBooleanValue: (field: string) => {
      const v = base.getValue(field)
      return v === true || v === 'true'
    },
    setValue: (fieldName: string, value: any, displayValue: any) => {
      if (displayValue) {
        const localField = getFormFields()[fieldName]
        if (localField) {
          localField.displayValue = String(displayValue)
        }
      }

      setValue(fieldName, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
      const handlers = fieldChangeHandlers.current
      if (handlers?.[fieldName]) handlers[fieldName](value)
    },
    clearValue: (field: string) => base.setValue(field, ''),

    // Labels
    getLabel: _getLabel,
    getLabelOf: _getLabel,
    setLabel: _setLabel,
    setLabelOf: _setLabel,

    // Sections
    getSectionNames: () => getSections().map(s => formatSectionName(s.caption!)),
    setSectionDisplay: (sectionName: string, state: boolean) => {
      const sections = getSections()
      const section = sections.find(s => formatSectionName(s.caption!) === sectionName)
      if (section) section.visible = state
    },

    // UI State Getters
    isMandatory(field: string): boolean {
      return getFieldUIState(field).mandatory
    },

    // UI Action Operations
    getActionName: () => _actionName,
    save: (action?: string) => clientSubmit(action || 'sysverb_update_and_stay'),
    submit: (action?: string) => clientSubmit(action || 'sysverb_update'),

    // UI State updates
    setDisabled: (field: string) => updateFieldUI(field, { readonly: true }),
    setDisplay: (field: string, state: boolean) => updateFieldUI(field, { visible: state }),
    setVisible: (field: string, state: boolean) => updateFieldUI(field, { visible: state }),
    setReadOnly: (field: string, state: boolean) => updateFieldUI(field, { readonly: state }),
    setMandatory: (field: string, state: boolean) => updateFieldUI(field, { mandatory: state }),

    // Choices management
    addOption: (fieldName: string, choiceValue: string, choiceLabel: string, choiceIndex?: number) => {
      const field = getFormFields()[fieldName]
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
      const fields = getFormFields()
      const field = fields[fieldName]
      if (!field || !field.choices) return

      if (base.getValue(fieldName) === choiceValue) {
        base.setValue(fieldName, '')
      }

      field.choices = field.choices.filter(choice => choice.value !== choiceValue)
    },
    clearOptions: (fieldName: string) => {
      const field = getFormFields()[fieldName]
      if (!field || !field.choices) return
      field.choices = field.choices.filter(choice => choice.value === '')
    },

    // Messaging
    addErrorMessage: (message: string) => {
      if (!message) return
      toast.error(message, { duration: 10000 })
    },
    addInfoMessage: (message: string) => {
      if (!message) return
      toast.info(htmlToReact(message))
    },
    showErrorBox(fieldName: string, message: string) {
      this.showFieldMsg(fieldName, message, 'error')
    },
    hideErrorBox(fieldName: string) {
      this.hideFieldMsg(fieldName, false)
    },
    showFieldMsg(fieldName: string, message: string, type?: string) {
      if (!fieldName || !message || !base.hasField(fieldName)) return

      const current = getFieldUIState(fieldName).fieldMsgs ?? []
      const next = [...current, { text: String(message), type: normalizeFieldMsgType(type) }]

      setFieldMessages(fieldName, next)
    },
    hideFieldMsg(fieldName: string, clearAll = false) {
      if (!fieldName || !base.hasField(fieldName)) return

      const current = getFieldUIState(fieldName).fieldMsgs ?? []
      if (current.length === 0) return

      const next = clearAll ? [] : current.slice(0, -1)
      setFieldMessages(fieldName, next)
    },
    hideAllFieldMsgs(type?: string) {
      const fields = getFormFields()
      const targetType = type ? normalizeFieldMsgType(type) : undefined

      for (const fieldName of Object.keys(fields)) {
        const current = getFieldUIState(fieldName).fieldMsgs ?? []
        const next = targetType ? current.filter(msg => msg.type !== targetType) : []

        if (next.length !== current.length) {
          setFieldMessages(fieldName, next)
        }
      }
    },

    // Iconography
    addDecoration(fieldName: string, icon: string, title?: string) {
      if (!fieldName || !icon || !base.hasField(fieldName)) return
      if (!isSupportedSnDecorationIcon(icon)) {
        console.warn(`g_form.addDecoration: unsupported icon "${icon}"`)
        return
      }

      const next: FieldDecoration = {
        icon: icon as SnDecorationIcon,
        title: title ? String(title) : undefined,
      }

      setFieldDecoration(fieldName, next)
    },
    removeDecoration(fieldName: string, icon?: string, title?: string) {
      if (!fieldName || !base.hasField(fieldName)) return

      const current = getFieldUIState(fieldName).decoration
      if (!current) return
      if (icon && current.icon !== icon) return
      if (title !== undefined && (current.title ?? '') !== String(title)) return

      setFieldDecoration(fieldName, undefined)
    },

    // Data fetching helpers
    async getReference(fieldName: string, cb: (obj: any) => void) {
      try {
        const field = getFormFields()[fieldName]
        if (!field || field.type !== 'reference') return cb(null)

        const sys_id: string = base.getValue(fieldName)
        if (!sys_id) return cb(null)

        const refTable: string = field.ed!.reference
        if (!refTable) return cb(null)

        const cacheKey = `${refTable}:${sys_id}`
        if (refCache.has(cacheKey)) return cb(refCache.get(cacheKey))

        const ga = new GlideAjax('AJAXGlideRecord')
        ga.addParam('sysparm_name', refTable)
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

    // Unsupported/Portal-parity (warn-only, non-fatal)
    hideRelatedList() {},
    hideRelatedLists() {},
    showRelatedList() {},
    showRelatedLists() {},
    getRelatedListNames() {},

    getEncodedRecord() {
      console.warn('GForm getEncodedRecord method is not supported in React')
    },

    //Unsupported Desktop or Legacy
    flash() {
      console.warn('GForm flash method is not supported in React')
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
    isSectionVisible() {
      console.warn('GForm isSectionVisible method is not supported in React')
    },
    getFormElement() {
      console.warn('GForm getFormElement method is not supported in React')
    },
    clearMessages() {
      console.warn('GForm clearMessages method is not supported in React')
    },
    validate() {
      console.warn('GForm validate method is not supported in React')
    },
  }

  // Warn once for any other missing methods instead of throwing
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
