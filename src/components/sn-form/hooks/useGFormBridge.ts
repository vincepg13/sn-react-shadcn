/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefObject, useEffect, useRef } from 'react'
import { Path, UseFormReturn } from 'react-hook-form'
import { createGFormBridge } from '@kit/lib/g-form'
import {
  FieldUIState,
  SnFieldPrimitive,
  SnFieldsSchema,
  SnSection,
  SnUiAction,
  UiActionHandler,
} from '@kit/types/form-schema'
import type { SnGForm } from '@kit/types/g-form'
import { toRaw } from './useDotSafeForm'

type FieldChangeHandlers = RefObject<Record<string, (value: SnFieldPrimitive) => void>>

interface UseGFormBridgeParams<TFormValues extends Record<string, any> = Record<string, any>> {
  form: UseFormReturn<TFormValues>
  formFields: SnFieldsSchema
  sections: SnSection[]
  fieldUIState: Record<string, FieldUIState>
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void
  fieldChangeHandlersRef: FieldChangeHandlers
  scope: string
  view: string
  uiActions: SnUiAction[]
  table?: string
  guid?: string
}

/**
 * Creates a stable gForm bridge once, while always reading the latest
 * RHF functions, formFields, sections, and display values through refs.
 */
export function useGFormBridge<TFormValues extends Record<string, any> = Record<string, any>>({
  form,
  formFields,
  sections,
  fieldUIState,
  updateFieldUI,
  fieldChangeHandlersRef,
  scope,
  view,
  table,
  guid,
  uiActions,
}: UseGFormBridgeParams<TFormValues>) {
  // Keep mutable inputs in refs so the bridge can stay a singleton
  const formFieldsRef = useRef(formFields)
  const sectionsRef = useRef(sections)
  const displayValuesRef = useRef<Record<string, string>>({})
  const fieldUIStateRef = useRef<Record<string, FieldUIState>>({})
  const uiActionHandlerRef = useRef<UiActionHandler>(undefined)

  const setUiActionHandler = (fn?: UiActionHandler) => {
      uiActionHandlerRef.current = fn
  }

  useEffect(() => {
    fieldUIStateRef.current = fieldUIState
  }, [fieldUIState])

  useEffect(() => {
    formFieldsRef.current = formFields
  }, [formFields])

  useEffect(() => {
    sectionsRef.current = sections
  }, [sections])

  useEffect(() => {
    displayValuesRef.current = Object.fromEntries(
      Object.entries(formFields).map(([name, field]) => [name, field.displayValue ?? ''])
    )
  }, [formFields])

  // Wrap volatile RHF functions via refs so calls are always fresh
  const getValuesRef = useRef(form.getValues)
  const setValueRef = useRef(form.setValue)
  const updateFieldUIRef = useRef(updateFieldUI)

  useEffect(() => {
    getValuesRef.current = form.getValues
  }, [form])

  useEffect(() => {
    setValueRef.current = form.setValue
  }, [form])

  useEffect(() => {
    updateFieldUIRef.current = updateFieldUI
  }, [updateFieldUI])

  // Thin, stable wrappers the bridge will call
  const getValuesRaw = () =>
    Object.fromEntries(
      Object.entries(getValuesRef.current()).map(([name, value]) => [toRaw(name), value])
    ) as Record<string, SnFieldPrimitive | null | undefined>
  const setValueSafe = (
    name: string,
    val: SnFieldPrimitive,
    opts?: { shouldDirty?: boolean; shouldTouch?: boolean; shouldValidate?: boolean }
  ) => setValueRef.current(name as Path<TFormValues>, val as never, opts)
  const updateFieldUISafe = (name: string, patch: Partial<FieldUIState>) => updateFieldUIRef.current(name, patch)

  // Create the bridge once
  const gFormRef = useRef<SnGForm | null>(null)
  if (!gFormRef.current) {
    gFormRef.current = createGFormBridge({
      formFieldsRef,
      getValues: getValuesRaw,
      setValue: setValueSafe,
      updateFieldUI: updateFieldUISafe,
      fieldChangeHandlers: fieldChangeHandlersRef,
      sectionsRef,
      displayValuesRef,
      fieldUIStateRef,
      scope,
      view,
      table,
      guid,
      uiActions,
      uiActionHandlerRef,
    })
  }

  return {
    gForm: gFormRef.current!,
    displayValuesRef,
    setUiActionHandler,
  }
}
