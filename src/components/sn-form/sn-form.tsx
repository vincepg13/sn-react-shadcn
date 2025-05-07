/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { z, ZodTypeAny } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FieldUIState, SnClientScript, SnFieldsSchema, SnFormConfig, SnPolicy, SnUiAction } from '@kit/types/form-schema'
import { SnField } from './sn-form-fields/sn-field'
import { Toaster } from '../../components/ui/sonner'
import { SnFormActions, SnFormActionsRef } from './sn-form-actions'
import { SnClientScriptContext } from './contexts/SnClientScriptContext'
import { mapFieldToZod } from '@kit/utils/form-zod'
import { useClientScripts } from './hooks/useClientScripts'
import { useUiPolicies } from './hooks/useUiPolicies'
import { SnUiPolicyContext } from './contexts/SnUiPolicyContext'

interface SnFormProps {
  table: string
  guid: string
  uiActions: SnUiAction[]
  formFields: SnFieldsSchema
  formConfig: SnFormConfig
  clientScripts: SnClientScript[]
  uiPolicies: SnPolicy[]
}

export function SnForm({ table, guid, uiActions, formFields, formConfig, clientScripts, uiPolicies }: SnFormProps) {
  const actionRef = useRef<SnFormActionsRef>(null)
  const [fieldUIState, setFieldUIState] = useState<Record<string, FieldUIState>>({})
  const [hasReset, setHasReset] = useState(false)

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

  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: {},
    mode: 'onBlur',
  })

  const { runClientScriptsForFieldChange } = useClientScripts({
    form,
    table,
    guid,
    clientScripts: clientScripts || [],
    formFields,
    updateFieldUI,
  })

  const {
    runUiPolicies,
    runUiPoliciesForField,
  } = useUiPolicies({
    form,
    formFields,
    uiPolicies,
    updateFieldUI,
    formConfig,
  })

  useEffect(() => {
    if (!schema || !formFields || hasReset) return
    const values = form.getValues()
  
    form.reset(values, {
      keepErrors: true,
      keepDirty: true,
      keepTouched: true,
    })
  
    setHasReset(true)
  }, [schema, formFields, hasReset])
  
  const onSubmit = () => {
    actionRef.current?.triggerPrimaryAction()
  }

  return (
    <SnClientScriptContext.Provider value={{ runClientScriptsForFieldChange }}>
      <SnUiPolicyContext.Provider value={{ formConfig, runUiPolicies, runUiPoliciesForField }}>
        <FormProvider {...form}>
          <Toaster position="top-center" expand={true} richColors />
          <div className="w-full px-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-4xl mx-auto space-y-6">
              {Object.values(formFields).map(field => (
                <SnField
                  key={field.name}
                  field={field}
                  fieldUIState={fieldUIState}
                  updateFieldUI={updateFieldUI}
                  table={table}
                  guid={guid}
                />
              ))}
              <SnFormActions ref={actionRef} table={table} recordID={guid} uiActions={uiActions} formFields={formFields} />
            </form>
          </div>
        </FormProvider>
      </SnUiPolicyContext.Provider>
    </SnClientScriptContext.Provider>
  )
}
