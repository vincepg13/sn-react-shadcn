/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, type RefObject } from 'react'
import type { Path, UseFormReturn } from 'react-hook-form'
import { createGFormBridge } from '@kit/lib/g-form'
import { toRaw } from '@kit/components/sn-form/hooks/useDotSafeForm'
import type {
  FieldUIState,
  SnFieldPrimitive,
  SnFieldsSchema,
  SnSection,
  UiActionHandler,
} from '@kit/types/form-schema'
import type { SnGForm } from '@kit/types/g-form'
import type { SnCatalogItemSchema } from '@kit/types/catalog-schema'

type FieldChangeHandlers = RefObject<Record<string, (value: SnFieldPrimitive) => void>>

type UseCatalogGFormBridgeParams<TFormValues extends Record<string, any> = Record<string, any>> = {
  form: UseFormReturn<TFormValues>
  fields: SnFieldsSchema
  aliases: Record<string, string>
  catalogItem: SnCatalogItemSchema
  fieldUIState: Record<string, FieldUIState>
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void
  fieldChangeHandlersRef: FieldChangeHandlers
  scope: string
}

export function useCatalogGFormBridge<TFormValues extends Record<string, any> = Record<string, any>>({
  form,
  fields,
  aliases,
  catalogItem,
  fieldUIState,
  updateFieldUI,
  fieldChangeHandlersRef,
  scope,
}: UseCatalogGFormBridgeParams<TFormValues>) {
  const fieldsRef = useRef(fields)
  const aliasesRef = useRef(aliases)
  const displayValuesRef = useRef<Record<string, string>>({})
  const fieldUIStateRef = useRef<Record<string, FieldUIState>>({})
  const sectionsRef = useRef<SnSection[]>([])
  const uiActionHandlerRef = useRef<UiActionHandler | undefined>(undefined)
  const submitHandlerRef = useRef<((action?: string) => void | Promise<void>) | undefined>(undefined)
  const saveHandlerRef = useRef<((action?: string) => void | Promise<void>) | undefined>(() => {
    console.warn('g_form.save is not supported for catalog record producers')
  })

  useEffect(() => {
    fieldsRef.current = fields
    aliasesRef.current = aliases
    displayValuesRef.current = Object.fromEntries(
      Object.values(fields).map(field => [field.name, field.displayValue || ''])
    )
  }, [aliases, fields])

  useEffect(() => {
    fieldUIStateRef.current = fieldUIState
  }, [fieldUIState])

  const getValuesRef = useRef(form.getValues)
  const setValueRef = useRef(form.setValue)
  const updateFieldUIRef = useRef(updateFieldUI)

  useEffect(() => {
    getValuesRef.current = form.getValues
    setValueRef.current = form.setValue
  }, [form])

  useEffect(() => {
    updateFieldUIRef.current = updateFieldUI
  }, [updateFieldUI])

  const gFormRef = useRef<SnGForm | null>(null)
  if (!gFormRef.current) {
    gFormRef.current = createGFormBridge({
      formFieldsRef: fieldsRef,
      getValues: () =>
        Object.fromEntries(
          Object.entries(getValuesRef.current()).map(([name, value]) => [toRaw(name), value])
        ) as Record<string, SnFieldPrimitive | null | undefined>,
      setValue: (name, value, options) =>
        setValueRef.current(name as Path<TFormValues>, value as never, options),
      updateFieldUI: (name, patch) => updateFieldUIRef.current(name, patch),
      fieldChangeHandlers: fieldChangeHandlersRef,
      sectionsRef,
      displayValuesRef,
      fieldUIStateRef,
      scope,
      view: '',
      table: catalogItem.sys_class_name,
      guid: catalogItem.sys_id,
      uiActions: [],
      uiActionHandlerRef,
      resolveFieldName: name => aliasesRef.current[name] || name,
      submitHandlerRef,
      saveHandlerRef,
    })
  }

  const setCatalogSubmitHandler = useCallback((handler?: (action?: string) => void | Promise<void>) => {
    submitHandlerRef.current = handler
  }, [])

  return {
    gForm: gFormRef.current!,
    displayValuesRef,
    setCatalogSubmitHandler,
  }
}
