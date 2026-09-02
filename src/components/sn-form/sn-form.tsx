import { SnField } from './sn-form-fields/sn-field'
import { useUiActions } from './hooks/useUiActions'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUiPolicies } from './hooks/useUiPolicies'
import { toRaw, useDotSafeForm } from './hooks/useDotSafeForm'
import { useGFormBridge } from './hooks/useGFormBridge'
import { useScriptRunner } from './hooks/useScriptRunner'
import { useZodFormSchema } from './hooks/useZodFormSchema'
import { useClientScripts } from './hooks/useClientScripts'
import { SnAttachment } from '@kit/types/attachment-schema'
import { FormProvider, FieldErrors } from 'react-hook-form'
import { SnFormLayout } from './sn-form-layout/sn-form-layout'
import { SnFormActions } from './sn-form-layout/sn-form-actions'
import { SnUiPolicyContext } from './contexts/SnUiPolicyContext'
import { SnUiActionContext } from './contexts/SnUiActionContext'
import { useFieldUIStateManager } from './hooks/useFieldUiState'
import { SnFormActivity } from '../sn-ui/sn-activity/sn-form-activity'
import { SnClientScriptContext } from './contexts/SnClientScriptContext'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SnFormLifecycleContext } from './contexts/SnFormLifecycleContext'
import { useNormalizedDefaultValues } from './hooks/useNormalizedDefaultValues'
import {
  HintDisplayType,
  SnActivity,
  SnClientScript,
  SnFieldPrimitive,
  SnFieldsSchema,
  SnFormApis,
  SnFormConfig,
  SnPolicy,
  SnReferenceFieldCallbacks,
  SnSection,
  SnUiAction,
} from '@kit/types/form-schema'
import type { BeforeUiActionSubmitCallback, UiActionClientCallback } from '@kit/types/g-form'

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
  attachments: SnAttachment[] | null
  messages: Record<string, string>
  scratchpad: Record<string, unknown>
  hintDisplay?: HintDisplayType
  textareaThreshold?: number
  activityPostType?: 'inline' | 'textarea'
  uiActionClientCallback?: UiActionClientCallback
  beforeUiActionSubmitCallback?: BeforeUiActionSubmitCallback
  referenceFieldCallbacks?: SnReferenceFieldCallbacks
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
  hintDisplay = 'hover',
  textareaThreshold = 200,
  activityPostType = 'inline',
  uiActionClientCallback,
  beforeUiActionSubmitCallback,
  referenceFieldCallbacks,
  setAttachments,
  snInsert,
  snSubmit,
}: SnFormProps) {
  const fieldTabMapRef = useRef<Record<string, string>>({})
  const fieldChangeHandlersRef = useRef<Record<string, (val: SnFieldPrimitive) => void>>({})

  const fieldList = useMemo(() => Object.keys(formFields), [formFields])

  const [overrideTab, setOverrideTab] = useState<string | undefined>()
  const { fieldUIState, updateFieldUI, waitForFieldUIUpdates } = useFieldUIStateManager(formFields)
  const { defaultValues, buildNormalizedValues } = useNormalizedDefaultValues(formFields)
  const schema = useZodFormSchema(formFields, fieldUIState)

  const form = useDotSafeForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!formFields || !schema) return
    form.reset({}, { keepErrors: true, keepDirty: false, keepTouched: true })
    const normalized = buildNormalizedValues(formFields, {})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.reset(normalized as any, { keepErrors: true, keepDirty: true, keepTouched: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { gForm, displayValuesRef, setUiActionHandler } = useGFormBridge({
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
    uiActions,
  })

  const { executeClientScript, executePolicyScript } = useScriptRunner({
    gForm,
    scratchpad,
    messages,
    scope: formConfig.scope,
    glideUser: formConfig.glide_user,
  })

  const { runClientScriptsForFieldChange, runOnSubmitClientScripts } = useClientScripts({
    form,
    clientScripts: clientScripts || [],
    formFields,
    executeClientScript,
  })

  const { runUiPolicies, runUiPoliciesForField } = useUiPolicies({
    form,
    formFields,
    uiPolicies,
    updateFieldUI,
    executePolicyScript,
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

  //UI Action handling and Lifecycle Callbacks
  const onValidationError = useCallback((errors: FieldErrors) => {
    const firstErrorField = toRaw(Object.keys(errors)[0])
    const tabKey = fieldTabMapRef.current[firstErrorField]
    if (tabKey) setOverrideTab(tabKey)
  }, [])

  const {
    handleUiAction,
    loadingActionId,
    visibleUiActions,
    uiActionController,
    isActionDisabled,
    registerPreUiActionCallback,
    registerPostUiActionCallback,
  } = useUiActions({
    form,
    gForm,
    onValidationError,
    formFields,
    uiActions,
    table,
    guid,
    attachmentGuid,
    runOnSubmitClientScripts,
    waitForFieldUIUpdates,
    snSubmit,
    snInsert,
    setUiActionHandler,
    uiActionClientCallback,
    beforeUiActionSubmitCallback,
  })

  return (
    <SnFormLifecycleContext.Provider value={{ formConfig, registerPreUiActionCallback, registerPostUiActionCallback }}>
      <SnClientScriptContext.Provider
        value={{
          apis,
          gForm,
          fieldUIState,
          runOnSubmitClientScripts,
          runClientScriptsForFieldChange,
          fieldChangeHandlers: fieldChangeHandlersRef.current,
        }}
      >
        <SnUiPolicyContext.Provider value={{ formConfig, runUiPolicies, runUiPoliciesForField }}>
          <SnUiActionContext.Provider
            value={{
              handleUiAction,
              uiActions,
              visibleUiActions,
              uiActionController,
              isActionDisabled,
              loadingActionId,
            }}
          >
            <FormProvider {...form}>
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
                            inputType={activityPostType}
                          />
                        )
                      }

                      if (!field) return null

                      return (
                        <div>
                          <SnField
                            key={field.name}
                            field={field}
                            fieldList={fieldList}
                            fieldUIState={fieldUIState}
                            displayValues={displayValuesRef}
                            hintDisplay={hintDisplay}
                            textareaThreshold={textareaThreshold}
                            referenceFieldCallbacks={referenceFieldCallbacks}
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
                    attachments={attachments}
                    attachmentGuid={attachmentGuid}
                    setAttachments={setAttachments}
                  />
                </form>
              </div>
            </FormProvider>
          </SnUiActionContext.Provider>
        </SnUiPolicyContext.Provider>
      </SnClientScriptContext.Provider>
    </SnFormLifecycleContext.Provider>
  )
}
