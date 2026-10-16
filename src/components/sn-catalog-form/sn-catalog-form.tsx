/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, type FieldErrors } from 'react-hook-form'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SnField } from '@kit/components/sn-form/sn-form-fields/sn-field'
import { SnClientScriptContext } from '@kit/components/sn-form/contexts/SnClientScriptContext'
import { SnUiPolicyContext } from '@kit/components/sn-form/contexts/SnUiPolicyContext'
import { useClientScripts } from '@kit/components/sn-form/hooks/useClientScripts'
import { useDotSafeForm, toRaw } from '@kit/components/sn-form/hooks/useDotSafeForm'
import { useFieldUIStateManager } from '@kit/components/sn-form/hooks/useFieldUiState'
import { useNormalizedDefaultValues } from '@kit/components/sn-form/hooks/useNormalizedDefaultValues'
import { useScriptRunner } from '@kit/components/sn-form/hooks/useScriptRunner'
import { normalizeCatalogItem, serializeCatalogVariables } from '@kit/utils/catalog-adapter'
import { submitCatalogProducer as submitCatalogProducerApi, getCatalogApiErrorMessage } from '@kit/utils/catalog-api'
import { SnCatalogLayout } from './sn-catalog-layout'
import { SnCatalogActions } from './sn-catalog-actions'
import { useCatalogFormSchema } from './hooks/useCatalogFormSchema'
import { useCatalogGFormBridge } from './hooks/useCatalogGFormBridge'
import { useCatalogUiPolicies } from './hooks/useCatalogUiPolicies'
import type {
  SnCatalogItemSchema,
  SnCatalogFormOptions,
  SnCatalogRuntimeConfig,
  SnCatalogSubmissionResult,
  SnCatalogSubmitFunction,
  SnCatalogVariableValue,
} from '@kit/types/catalog-schema'
import type { SnFieldPrimitive, SnReferenceFieldCallbacks } from '@kit/types/form-schema'

export type SnCatalogFormProps = {
  catalogItem: SnCatalogItemSchema
  runtime: SnCatalogRuntimeConfig
  apis?: {
    serviceCatalogBase?: string
    refDisplay?: string
  }
  formOptions?: SnCatalogFormOptions
  referenceFieldCallbacks?: SnReferenceFieldCallbacks
  submitProducer?: SnCatalogSubmitFunction
  onSubmitted?: (result: SnCatalogSubmissionResult) => void | Promise<void>
}

export function SnCatalogForm({
  catalogItem,
  runtime,
  apis,
  formOptions,
  referenceFieldCallbacks,
  submitProducer,
  onSubmitted,
}: SnCatalogFormProps) {
  const normalized = useMemo(() => normalizeCatalogItem(catalogItem), [catalogItem])
  const { fields, aliases, sections, clientScripts, policies, messages } = normalized
  const fieldList = useMemo(() => Object.keys(fields), [fields])
  const fieldChangeHandlersRef = useRef<Record<string, (value: SnFieldPrimitive) => void>>({})
  const submitLockRef = useRef(false)

  const { hintDisplay = 'collapsibleAlert', textareaThreshold = 200, submitLabel = 'Submit' } = formOptions || {}
  const { fieldUIState, updateFieldUI, waitForFieldUIUpdates } = useFieldUIStateManager(fields)
  const { defaultValues } = useNormalizedDefaultValues(fields)
  const schema = useCatalogFormSchema(fields, fieldUIState)
  const form = useDotSafeForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  })

  const { gForm, displayValuesRef, setCatalogSubmitHandler } = useCatalogGFormBridge({
    form,
    fields,
    aliases,
    catalogItem,
    fieldUIState,
    updateFieldUI,
    fieldChangeHandlersRef,
    scope: runtime.scope,
  })

  const { executeClientScript, executePolicyScript } = useScriptRunner({
    gForm,
    scratchpad: runtime.scratchpad || catalogItem.g_scratchpad || {},
    messages,
    scope: runtime.scope,
    glideUser: runtime.glide_user,
  })

  const { runClientScriptsForFieldChange, runOnSubmitClientScripts } = useClientScripts({
    form,
    clientScripts,
    formFields: fields,
    executeClientScript,
  })

  const { runUiPolicies, runUiPoliciesForField } = useCatalogUiPolicies({
    form,
    formFields: fields,
    uiPolicies: policies,
    updateFieldUI,
    executePolicyScript,
    formConfig: runtime,
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [submissionResult, setSubmissionResult] = useState<SnCatalogSubmissionResult | null>(null)

  const submitVariables = useMemo<SnCatalogSubmitFunction>(() => {
    if (submitProducer) return submitProducer
    return variables =>
      submitCatalogProducerApi({
        catalogItemId: catalogItem.sys_id,
        variables,
        serviceCatalogBase: apis?.serviceCatalogBase,
      })
  }, [apis?.serviceCatalogBase, catalogItem.sys_id, submitProducer])

  const validateForm = useCallback(async () => {
    let valid = false
    let firstInvalidField: string | undefined

    await form.handleSubmit(
      () => {
        valid = true
      },
      (errors: FieldErrors) => {
        firstInvalidField = Object.keys(errors)[0]
      }
    )()

    if (firstInvalidField) form.setFocus(toRaw(firstInvalidField))
    return valid
  }, [form])

  const handleSubmit = useCallback(async () => {
    if (submitLockRef.current || submitted) return
    submitLockRef.current = true
    setSubmitting(true)
    setSubmissionError(null)

    try {
      await waitForFieldUIUpdates()
      if (!(await validateForm())) return
      if (runOnSubmitClientScripts('submit_producer') === false) return

      const variables = serializeCatalogVariables(
        fields,
        form.getValues() as Record<string, SnCatalogVariableValue>
      )
      const result = await submitVariables(variables)

      setSubmissionResult(result)
      setSubmitted(true)
      if (onSubmitted) {
        void Promise.resolve(onSubmitted(result)).catch(error => {
          console.error('SnCatalogForm onSubmitted callback failed', error)
        })
      }
    } catch (error) {
      const message = getCatalogApiErrorMessage(error, 'The record producer could not be submitted')
      if (message) setSubmissionError(message)
    } finally {
      submitLockRef.current = false
      setSubmitting(false)
    }
  }, [fields, form, onSubmitted, runOnSubmitClientScripts, submitVariables, submitted, validateForm, waitForFieldUIUpdates])

  useEffect(() => {
    setCatalogSubmitHandler(handleSubmit)
    return () => setCatalogSubmitHandler(undefined)
  }, [handleSubmit, setCatalogSubmitHandler])

  useEffect(() => {
    setSubmitted(false)
    setSubmissionError(null)
    setSubmissionResult(null)
  }, [catalogItem.sys_id])

  const targetTable = catalogItem.target_table_name || catalogItem.sys_class_name

  return (
    <SnClientScriptContext.Provider
      value={{
        apis: { refDisplay: apis?.refDisplay },
        gForm,
        fieldUIState,
        runOnSubmitClientScripts,
        runClientScriptsForFieldChange,
        fieldChangeHandlers: fieldChangeHandlersRef.current,
      }}
    >
      <SnUiPolicyContext.Provider value={{ formConfig: runtime, runUiPolicies, runUiPoliciesForField }}>
        <FormProvider {...form}>
          <div className="w-full">
            <header className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">
                {catalogItem.name || catalogItem.short_description || 'Record producer'}
              </h2>
              {catalogItem.name && catalogItem.short_description && (
                <p className="mt-1 text-sm text-muted-foreground">{catalogItem.short_description}</p>
              )}
            </header>

            <form
              className="w-full"
              onSubmit={event => {
                event.preventDefault()
                void handleSubmit()
              }}
            >
              <SnCatalogLayout
                sections={sections}
                renderVariable={name => {
                  const field = fields[name]
                  if (!field) return null

                  return (
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
                      table={targetTable}
                      guid="-1"
                    />
                  )
                }}
              />

              <SnCatalogActions
                error={submissionError}
                result={submissionResult}
                submitLabel={submitLabel}
                submitting={submitting}
                submitted={submitted}
              />
            </form>
          </div>
        </FormProvider>
      </SnUiPolicyContext.Provider>
    </SnClientScriptContext.Provider>
  )
}
