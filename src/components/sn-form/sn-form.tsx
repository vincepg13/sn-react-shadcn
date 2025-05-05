/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { z, ZodTypeAny } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FieldUIState, SnFieldsSchema, SnFormConfig, SnUiAction } from '@kit/types/form-schema'
import { getFormData } from '@kit/utils/form-api'
import { SnField } from './sn-form-fields/sn-field'
import { Toaster } from '../../components/ui/sonner'
import { SnFormActions, SnFormActionsRef } from './sn-form-actions'
import { SnClientScriptContext } from './contexts/SnClientScriptContext'
import { mapFieldToZod } from '@kit/utils/form-client'
import { useClientScripts } from './hooks/useClientScripts'
import { useUiPolicies } from './hooks/useUiPolicies'
import { SnUiPolicyContext } from './contexts/SnUiPolicyContext'

interface SnFormProps {
  table: string
  guid: string
}

export function SnForm({ table, guid }: SnFormProps) {
  const actionRef = useRef<SnFormActionsRef>(null)
  const [uiActions, setUiActions] = useState<SnUiAction[]>([])
  const [formFields, setFormFields] = useState<SnFieldsSchema | null>(null)
  const [fieldUIState, setFieldUIState] = useState<Record<string, FieldUIState>>({})
  const [formConfig, setFormConfig] = useState<SnFormConfig | null>(null)
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

  const { setClientScripts, runClientScriptsForFieldChange } = useClientScripts({
    form,
    table,
    guid,
    formFields,
    updateFieldUI,
  })

  const {
    // uiPolicies,
    setUiPolicies,
    runUiPolicies,
    runUiPoliciesForField,
  } = useUiPolicies({
    form,
    formFields,
    updateFieldUI,
    formConfig,
  })

  useEffect(() => {
    if (!schema || !formFields || hasReset) return
  
    // const values = Object.fromEntries(
    //   Object.entries(formFields).map(([name, field]) => [name, field.value ?? ''])
    // )
    const values = form.getValues()
  
    console.log("FORM RESET VALUES", values)
  
    form.reset(values, {
      keepErrors: true,
      keepDirty: true,
      keepTouched: true,
    })
  
    setHasReset(true)
  }, [schema, formFields, hasReset])
  

  useEffect(() => {
    const getForm = async () => {
      const controller = new AbortController()
      try {
        const response = await getFormData(table, guid, controller)
        if (response.status === 200) {
          const form = response.data.result
          console.log('FORM DATA:', form)
          setFormConfig(form.react_config)
          setUiActions(form._ui_actions)
          setFormFields(form._fields)
          setClientScripts(form.client_script?.onChange || [])
          setUiPolicies(form.policy || [])
        }
      } catch (error) {
        console.error('Error fetching form data:', error)
      }
    }
    getForm()
  }, [table, guid])

  const onSubmit = (data: Record<string, any>) => {
    console.log('Form submitted!:', data, actionRef.current)
    actionRef.current?.triggerPrimaryAction()
  }

  if (!formFields || !schema) return <div>Loading form...</div>

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
              <button type="submit" className="mt-4">
                Submit
              </button>
              <SnFormActions ref={actionRef} table={table} recordID={guid} uiActions={uiActions} formFields={formFields} />
            </form>
          </div>
        </FormProvider>
      </SnUiPolicyContext.Provider>
    </SnClientScriptContext.Provider>
  )
}
