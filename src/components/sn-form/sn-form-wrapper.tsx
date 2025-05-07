import { SnUiAction, SnFieldsSchema, SnFormConfig, SnClientScript, SnPolicy } from '@kit/types/form-schema'
import { getFormData } from '@kit/utils/form-api'
import { useEffect, useState } from 'react'
import { SnForm } from './sn-form'

interface SnFormProps {
  table: string
  guid: string
}

export function SnFormWrapper({ table, guid }: SnFormProps) {
  const [loading, setLoading] = useState(true)
  const [uiActions, setUiActions] = useState<SnUiAction[]>([])
  const [formFields, setFormFields] = useState<SnFieldsSchema | null>(null)
  const [formConfig, setFormConfig] = useState<SnFormConfig | null>(null)
  const [clientScripts, setClientScripts] = useState<SnClientScript[]>([])
  const [uiPolicies, setUiPolicies] = useState<SnPolicy[]>([])

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
      } finally {
        setLoading(false)
      }
    }
    getForm()
  }, [table, guid])

  if (loading) return <div>Loading form...</div>

  return (
    <SnForm
      table={table}
      guid={guid}
      formFields={formFields!}
      uiActions={uiActions}
      formConfig={formConfig!}
      clientScripts={clientScripts}
      uiPolicies={uiPolicies}
    ></SnForm>
  )
}
