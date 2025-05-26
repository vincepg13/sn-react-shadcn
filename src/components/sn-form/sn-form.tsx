/* eslint-disable @typescript-eslint/no-explicit-any */
import { z, ZodTypeAny } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { SnField } from './sn-form-fields/sn-field'
import { Toaster } from '../../components/ui/sonner'
import { mapFieldToZod } from '@kit/utils/form-zod'
import { useUiPolicies } from './hooks/useUiPolicies'
import { createGFormBridge } from '@kit/utils/form-client'
import { useClientScripts } from './hooks/useClientScripts'
import { SnFormLayout } from './sn-form-layout/sn-form-layout'
import { SnFormActions } from './sn-form-layout/sn-form-actions'
import { SnUiPolicyContext } from './contexts/SnUiPolicyContext'
import { useForm, FormProvider, FieldErrors } from 'react-hook-form'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SnClientScriptContext } from './contexts/SnClientScriptContext'
import { SnAttachment } from '@kit/types/attachment-schema'

import {
  FieldUIState,
  SnClientScript,
  SnFieldsSchema,
  SnFormApis,
  SnFormConfig,
  SnPolicy,
  SnSection,
  SnUiAction,
} from '@kit/types/form-schema'
import { SnFormLifecycleContext } from './contexts/SnFormLifecycleContext'

interface SnFormProps {
  table: string
  guid: string
  attachmentGuid: string
  uiActions: SnUiAction[]
  formFields: SnFieldsSchema
  formConfig: SnFormConfig
  clientScripts: SnClientScript[]
  uiPolicies: SnPolicy[]
  sections: SnSection[]
  apis: SnFormApis
  attachments: SnAttachment[]
  setAttachments: (attachments: SnAttachment[]) => void
  snSubmit?(guid: string): void
}

export function SnForm({
  table,
  guid,
  attachmentGuid,
  uiActions,
  formFields,
  formConfig,
  clientScripts,
  uiPolicies,
  sections,
  apis,
  attachments,
  setAttachments,
  snSubmit,
}: SnFormProps) {
  const [fieldUIState, setFieldUIState] = useState<Record<string, FieldUIState>>({})
  const fieldTabMapRef = useRef<Record<string, string>>({})
  const [overrideTab, setOverrideTab] = useState<string | undefined>()
  const fieldChangeHandlersRef = useRef<Record<string, (val: any) => void>>({})

  const updateFieldUI = useCallback((field: string, updates: Partial<FieldUIState>) => {
    setFieldUIState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        ...updates,
      },
    }))
  }, [])

  const schema = useMemo(() => {
    if (!formFields) return null

    const shape: Record<string, ZodTypeAny> = {}
    for (const field of Object.values(formFields)) {
      const overrides = fieldUIState[field.name] || {}
      const effectiveField = {
        ...field,
        mandatory: overrides.mandatory ?? field.mandatory,
      }
      shape[field.name] = mapFieldToZod(effectiveField)
    }

    return z.object(shape)
  }, [formFields, fieldUIState])

  const defaultValues = useMemo(() => {
    const raw = Object.fromEntries(Object.entries(formFields).map(([name, field]) => [name, field.value ?? '']))
    return buildNormalizedValues(formFields, raw)
  }, [formFields])

  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode: 'onBlur',
  })

  const gForm = useMemo(() => {
    return createGFormBridge(form.getValues, form.setValue, updateFieldUI, fieldChangeHandlersRef, table, guid)
  }, [form, guid, table, updateFieldUI])

  const { runClientScriptsForFieldChange } = useClientScripts({
    form,
    clientScripts: clientScripts || [],
    formFields,
    gForm,
  })

  const { runUiPolicies, runUiPoliciesForField } = useUiPolicies({
    form,
    formFields,
    uiPolicies,
    updateFieldUI,
    formConfig,
  })

  function buildNormalizedValues(fields: SnFieldsSchema, currentValues: Record<string, any>) {
    const values: Record<string, any> = { ...currentValues }

    for (const field of Object.values(fields)) {
      const fieldValue = currentValues[field.name]

      if (field.type === 'user_image') {
        const hasDisplayValueMismatch =
          field.displayValue && (!fieldValue || !field.displayValue.startsWith(fieldValue))

        if (hasDisplayValueMismatch) {
          values[field.name] = field.displayValue.replace(/\.iix$/, '')
        }
      }
    }

    return values
  }

  useEffect(() => {
    if (!formFields || !schema) return

    const rawValues = form.getValues()
    const normalizedValues = buildNormalizedValues(formFields, rawValues)

    form.reset(normalizedValues, {
      keepErrors: true,
      keepDirty: true,
      keepTouched: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleValidationError = (errors: FieldErrors) => {
    const firstErrorField = Object.keys(errors)[0]
    const tabKey = fieldTabMapRef.current[firstErrorField]
    if (tabKey) {
      setOverrideTab(tabKey)
    }
  }

  //Expose Lifecycle Callbacks
  const preUiActionCallbacksRef = useRef<Map<string, () => void | Promise<void>>>(new Map())
  const registerPreUiActionCallback = (fieldKey: string, cb: () => void | Promise<void>) => {
    preUiActionCallbacksRef.current.set(fieldKey, cb)
  }
  const postUiActionCallbacksRef = useRef<Map<string, () => void | Promise<void>>>(new Map())
  const registerPostUiActionCallback = (fieldKey: string, cb: () => void | Promise<void>) => {
    postUiActionCallbacksRef.current.set(fieldKey, cb)
  }
  const runUiActionCallbacks = async (type: 'pre' | 'post') => {
    const isPost = type == 'post'
    const callbacksMap = isPost ? postUiActionCallbacksRef.current : preUiActionCallbacksRef.current
    const callbacks = [...callbacksMap]

    for (const [, cb] of callbacks) {
      await cb()
    }

    callbacksMap.clear()
  }

  return (
    <SnFormLifecycleContext.Provider value={{ formConfig, registerPreUiActionCallback, registerPostUiActionCallback }}>
      <SnClientScriptContext.Provider
        value={{
          runClientScriptsForFieldChange,
          fieldChangeHandlers: fieldChangeHandlersRef.current,
          gForm,
          apis,
        }}
      >
        <SnUiPolicyContext.Provider value={{ formConfig, runUiPolicies, runUiPoliciesForField }}>
          <FormProvider {...form}>
            <Toaster position="top-center" expand={true} richColors />
            <div className="w-full px-4">
              <form className="w-full">
                <SnFormLayout
                  sections={sections}
                  overrideTab={overrideTab}
                  clearOverrideTab={() => setOverrideTab(undefined)}
                  onFieldTabMap={map => {
                    fieldTabMapRef.current = map
                  }}
                  renderField={name => {
                    const field = formFields[name]
                    if (!field) return null

                    return (
                      <SnField
                        key={field.name}
                        field={field}
                        fieldUIState={fieldUIState}
                        updateFieldUI={updateFieldUI}
                        table={table}
                        guid={guid}
                      />
                    )
                  }}
                />

                <SnFormActions
                  table={table}
                  recordID={guid}
                  uiActions={uiActions}
                  formFields={formFields}
                  attachments={attachments}
                  attachmentGuid={attachmentGuid}
                  snSubmit={snSubmit}
                  setAttachments={setAttachments}
                  handleSubmit={form.handleSubmit}
                  onValidationError={handleValidationError}
                  runUiActionCallbacks={runUiActionCallbacks}
                />
              </form>
            </div>
          </FormProvider>
        </SnUiPolicyContext.Provider>
      </SnClientScriptContext.Provider>
    </SnFormLifecycleContext.Provider>
  )
}
