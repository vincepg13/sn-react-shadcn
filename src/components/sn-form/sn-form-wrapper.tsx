import { SnForm } from './sn-form'
import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { getFormData } from '@kit/utils/form-api'
import { SnSection } from '@kit/types/form-schema'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { SnUiAction, SnFieldsSchema, SnFormConfig, SnClientScript, SnPolicy } from '@kit/types/form-schema'

interface SnFormProps {
  table: string
  guid: string
  api: string
}

function unionClientScripts(scripts: Record<string, SnClientScript[]>) {
  return Object.values(scripts).reduce((acc, curr) => {
    const merged = acc.concat(curr)
    return merged
  }, [] as SnClientScript[])
}

export function SnFormWrapper({ api, table, guid }: SnFormProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uiActions, setUiActions] = useState<SnUiAction[]>([])
  const [formFields, setFormFields] = useState<SnFieldsSchema | null>(null)
  const [formConfig, setFormConfig] = useState<SnFormConfig | null>(null)
  const [clientScripts, setClientScripts] = useState<SnClientScript[]>([])
  const [uiPolicies, setUiPolicies] = useState<SnPolicy[]>([])
  const [sections, setSections] = useState<SnSection[]>([])

  useEffect(() => {
    const getForm = async () => {
      const controller = new AbortController()
      try {
        const response = await getFormData(api, controller)
        if (response.status === 200) {
          console.log('Form data:', response.data)
          const form = response.data.result
          setFormConfig(form.react_config)
          setUiActions(form._ui_actions)
          setFormFields(form._fields)
          setClientScripts(unionClientScripts(form.client_script))
          setUiPolicies(form.policy || [])
          setSections(form._sections || [])
        }
      } catch (error) {
        setError('Error fetching form data, please make sure you have the form metadata api included in your instance')
        console.error('Error fetching form data:', error)
      } finally {
        setLoading(false)
      }
    }
    getForm()
  }, [api, table, guid])

  if (loading) return <div>Loading form...</div>

  if (!loading && (!formConfig || !formFields || sections.length === 0))
    return (
      <Alert variant="destructive" className="max-w-4xl mx-auto mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Metadata Error</AlertTitle>
        <AlertDescription>Error whilst fetching metadata</AlertDescription>
      </Alert>
    )

  return (
    <>
      {error && (
        <Alert variant="destructive" className="max-w-4xl mx-auto mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!error && (
        <SnForm
          table={table}
          guid={guid}
          formFields={formFields!}
          uiActions={uiActions}
          formConfig={formConfig!}
          clientScripts={clientScripts}
          uiPolicies={uiPolicies}
          sections={sections}
        ></SnForm>
      )}
    </>
  )
}
