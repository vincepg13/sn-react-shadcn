import { zodResolver } from '@hookform/resolvers/zod'
import { SnField } from './sn-form-fields/sn-field'
import { Toaster } from '../../components/ui/sonner'
import { useUiPolicies } from './hooks/useUiPolicies'
import { useZodFormSchema } from './hooks/useZodFormSchema'
import { useClientScripts } from './hooks/useClientScripts'
import { SnFormLayout } from './sn-form-layout/sn-form-layout'
import { SnFormActions } from './sn-form-layout/sn-form-actions'
import { SnUiPolicyContext } from './contexts/SnUiPolicyContext'
import { useUiActionLifecycle } from './hooks/useUiActionLifecycle'
import { useForm, FormProvider, FieldErrors } from 'react-hook-form'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SnClientScriptContext } from './contexts/SnClientScriptContext'
import { SnAttachment } from '@kit/types/attachment-schema'
import { SnFormLifecycleContext } from './contexts/SnFormLifecycleContext'
import { SnFormActivity } from '../sn-ui/sn-activity/sn-form-activity'
import { useFieldUIStateManager } from './hooks/useFieldUiState'
import { useNormalizedDefaultValues } from './hooks/useNormalizedDefaultValues'
import { useGFormBridge } from './hooks/useGFormBridge'

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
  view: string
  attachmentGuid: string
  uiActions: SnUiAction[]
  formFields: SnFieldsSchema
  formConfig: SnFormConfig
  clientScripts: SnClientScript[]
  uiPolicies: SnPolicy[]
  sections: SnSection[]
  apis: SnFormApis
  attachments: SnAttachment[]
  messages: Record<string, string>
  scratchpad: Record<string, unknown>
  activity?: SnActivity
  setAttachments: (attachments: SnAttachment[]) => void
  snSubmit(guid: string): void
  snInsert?(guid: string): void
}

export function SnForm({
  table,
  guid,
  view,
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
  messages,
  scratchpad,
  setAttachments,
  snInsert,
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

  const { gForm, displayValuesRef } = useGFormBridge({
    form,
    formFields,
    sections,
    fieldUIState,
    updateFieldUI,
    fieldChangeHandlersRef,
    scope: formConfig.scope,
    view,
    table,
    guid,
  })

  const { runClientScriptsForFieldChange } = useClientScripts({
    form,
    clientScripts: clientScripts || [],
    formFields,
    gForm,
    scratchpad,
    messages,
    scope: formConfig.scope,
    glideUser: formConfig.glide_user,
  })

  const { runUiPolicies, runUiPoliciesForField } = useUiPolicies({
    form,
    formFields,
    uiPolicies,
    updateFieldUI,
    formConfig,
  })

  // Normalize once on mount
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

  const handleValidationError = useCallback((errors: FieldErrors) => {
    const firstErrorField = Object.keys(errors)[0]
    const tabKey = fieldTabMapRef.current[firstErrorField]
    if (tabKey) setOverrideTab(tabKey)
  }, [])

  //Expose Lifecycle Callbacks
  const { registerPreUiActionCallback, registerPostUiActionCallback, runUiActionCallbacks } = useUiActionLifecycle()

  return (
    <SnFormLifecycleContext.Provider value={{ formConfig, registerPreUiActionCallback, registerPostUiActionCallback }}>
      <SnClientScriptContext.Provider
        value={{
          runClientScriptsForFieldChange,
          fieldChangeHandlers: fieldChangeHandlersRef.current,
          fieldUIState,
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
                      const journals = Object.values(formFields).filter(f => f.type === 'journal_input')
                      return (
                        <SnFormActivity
                          journalEntries={activity.entries}
                          journalFields={activity.journal_fields}
                          user={formConfig.user}
                          table={table}
                          guid={guid}
                          fieldUIState={fieldUIState}
                          journalInputs={journals}
                          getValues={form.getValues}
                          setValue={form.setValue}
                        />
                      )
                    }

                    if (!field) return null

                    return (
                      <div className="TESTFIELDWRAP">
                        <SnField
                          key={field.name}
                          field={field}
                          fieldUIState={fieldUIState}
                          displayValues={displayValuesRef}
                          updateFieldUI={updateFieldUI}
                          table={table}
                          guid={guid}
                        />
                      </div>
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
                  snInsert={snInsert}
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
