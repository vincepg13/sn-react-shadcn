import { zodResolver } from '@hookform/resolvers/zod'
import { SnField } from './sn-form-fields/sn-field'
import { Toaster } from '../../components/ui/sonner'
import { useUiPolicies } from './hooks/useUiPolicies'
import { createGFormBridge } from '@kit/utils/form-client'
import { useZodFormSchema } from './hooks/useZodFormSchema'
import { useClientScripts } from './hooks/useClientScripts'
import { SnFormLayout } from './sn-form-layout/sn-form-layout'
import { SnFormActions } from './sn-form-layout/sn-form-actions'
import { SnUiPolicyContext } from './contexts/SnUiPolicyContext'
import { useUiActionLifecycle } from './hooks/useUiActionLifecycle'
import { useForm, FormProvider, FieldErrors } from 'react-hook-form'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SnClientScriptContext } from './contexts/SnClientScriptContext'
import { SnAttachment } from '@kit/types/attachment-schema'
import { SnFormLifecycleContext } from './contexts/SnFormLifecycleContext'
import { SnFormActivity } from '../sn-ui/sn-activity/sn-form-activity'
import { useFieldUIStateManager } from './hooks/useFieldUiState'
import { useNormalizedDefaultValues } from './hooks/useNormalizedDefaultValues'

import {
  SnActivity,
  SnClientScript,
  SnFieldPrimitive,
  SnFieldsSchema,
  SnFormApis,
  SnFormConfig,
  SnPolicy,
  SnSection,
  SnUiAction,
} from '@kit/types/form-schema'

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
  activity?: SnActivity
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
  activity,
  setAttachments,
  snSubmit,
}: SnFormProps) {
  const fieldTabMapRef = useRef<Record<string, string>>({})
  const fieldChangeHandlersRef = useRef<Record<string, (val: SnFieldPrimitive) => void>>({})

  const [overrideTab, setOverrideTab] = useState<string | undefined>()
  const { fieldUIState, updateFieldUI } = useFieldUIStateManager(formFields)
  const { defaultValues, buildNormalizedValues } = useNormalizedDefaultValues(formFields)
  const schema = useZodFormSchema(formFields, fieldUIState)

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
  const { registerPreUiActionCallback, registerPostUiActionCallback, runUiActionCallbacks } = useUiActionLifecycle()

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
            <div className="w-full">
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

                    if (activity && name.includes(activity.formatter)) {
                      return <SnFormActivity activity={activity} />
                    }

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
