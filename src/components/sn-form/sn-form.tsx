/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { z, ZodTypeAny } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FieldUIState, SnFieldsSchema, SnUiAction } from '@kit/types/form-schema'
import { getFormData } from '@kit/utils/form-api'
import { SnField } from './sn-form-fields/sn-field'
import { Toaster } from '../../components/ui/sonner'
import { SnFormActions } from './sn-form-actions'
import { SnClientScriptContext } from './contexts/SnClientScriptContext'
import { mapFieldToZod } from '@kit/utils/form-client'
import { useClientScripts } from './hooks/useClientScripts'

interface SnFormProps {
  table: string
  guid: string
}

export function SnForm({ table, guid }: SnFormProps) {
  const [uiActions, setUiActions] = useState<SnUiAction[]>([])
  const [formFields, setFormFields] = useState<SnFieldsSchema | null>(null)
  const [fieldUIState, setFieldUIState] = useState<Record<string, FieldUIState>>({})

  function updateFieldUI(field: string, updates: Partial<FieldUIState>) {
    setFieldUIState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        ...updates,
      },
    }))
  }

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

  const { clientScripts, setClientScripts, runClientScriptsForFieldChange } = useClientScripts({
    form,
    table,
    guid,
    formFields,
    updateFieldUI,
  })

  useEffect(() => {
    if (!schema) return

    const values = form.getValues()
    form.reset(values, {
      keepErrors: true,
      keepDirty: true,
      keepTouched: true,
    })
  }, [schema])

  useEffect(() => {
    const getForm = async () => {
      const controller = new AbortController()
      try {
        const response = await getFormData(table, guid, controller)
        if (response.status === 200) {
          const form = response.data.result
          console.log('FORM DATA:', form)
          setUiActions(form._ui_actions)
          setFormFields(form._fields)
          setClientScripts(form.client_script?.onChange || [])
        }
      } catch (error) {
        console.error('Error fetching form data:', error)
      }
    }
    getForm()
  }, [table, guid])

  const onSubmit = (data: Record<string, any>) => {
    console.log('Form submitted:', data)
  }

  if (!formFields || !schema) return <div>Loading form...</div>

  return (
    <SnClientScriptContext.Provider value={{ clientScripts, runClientScriptsForFieldChange }}>
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
            <SnFormActions table={table} recordID={guid} uiActions={uiActions} formFields={formFields} />
          </form>
        </div>
      </FormProvider>
    </SnClientScriptContext.Provider>
  )
}
