import axios from 'axios'
import { SnForm } from './sn-form'
import { useEffect, useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { getFormData } from '@kit/utils/form-api'
import { SnAttachment } from '@kit/types/attachment-schema'
import { SnActivity, SnFormApis, SnSection } from '@kit/types/form-schema'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { SnUiAction, SnFieldsSchema, SnFormConfig, SnClientScript, SnPolicy } from '@kit/types/form-schema'
import { SnFormSkeleton } from './sn-form-skeleton'

interface SnFormProps {
  table: string
  guid: string
  apis: SnFormApis
  snInsert?(guid: string): void
  snSubmit?(guid: string): void
}

function unionClientScripts(scripts: Record<string, SnClientScript[]>) {
  return Object.values(scripts).reduce((acc, curr) => {
    if (Array.isArray(curr)) {
      return acc.concat(curr)
    }
    return acc
  }, [] as SnClientScript[])
}

export function SnFormWrapper({ apis, table, guid, snInsert, snSubmit }: SnFormProps) {
  const fetchIdRef = useRef(0)
  const [view, setView] = useState('')
  const [subCount, setSubCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uiActions, setUiActions] = useState<SnUiAction[]>([])
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [formFields, setFormFields] = useState<SnFieldsSchema | null>(null)
  const [formConfig, setFormConfig] = useState<SnFormConfig | null>(null)
  const [clientScripts, setClientScripts] = useState<SnClientScript[]>([])
  const [uiPolicies, setUiPolicies] = useState<SnPolicy[]>([])
  const [sections, setSections] = useState<SnSection[]>([])
  const [activity, setActivity] = useState<SnActivity | undefined>(undefined)
  const [attachments, setAttachments] = useState<SnAttachment[]>([])
  const [attachmentGuid, setAttachmentGuid] = useState<string>(guid)
  const [scratchpad, setScratchpad] = useState<Record<string, unknown>>({})

  const handleSubmit = snSubmit ? snSubmit : () => setSubCount(subCount + 1)

  useEffect(() => {
    setLoading(true)
    const controller = new AbortController()
    const fetchId = ++fetchIdRef.current

    setError(null)
    const getForm = async () => {
      try {
        console.log('Fetching form data...', apis.formData)
        const response = await getFormData(apis.formData, controller)
        if (response.status === 200) {
          console.log('Form data:', response.data)
          const form = response.data.result
          setFormConfig(form.react_config)
          setUiActions(form._ui_actions)
          setFormFields(form._fields)
          setClientScripts(unionClientScripts(form.client_script))
          setMessages(form.client_script.messages || {})
          setUiPolicies(form.policy || [])
          setSections(form._sections || [])
          setActivity(form.activity)
          setAttachments(form.attachments || [])
          setAttachmentGuid(form._attachmentGUID || guid)
          setView(form.view || '')
          setScratchpad(form.g_scratchpad || {})
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          if (error.code === 'ERR_CANCELED') return

          if (error.response?.data?.error?.message) {
            setError(error.response.data.error.message)
          } else {
            setError(
              'Error fetching form data, please make sure you have the form metadata api included in your instance'
            )
          }
        } else {
          setError('Unexpected error fetching form data')
        }

        if (!axios.isAxiosError(error) || error.code !== 'ERR_CANCELED') {
          console.error('Error fetching form data:', error)
        }
      } finally {
        if (fetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }
    getForm()

    return () => {
      controller.abort()
    }
  }, [apis.formData, table, guid, subCount])

  if (loading)
    return (
      <div className="w-full">
        {/* Loading form... */}
        <SnFormSkeleton />
      </div>
    )

  if (!loading && (!formConfig || !formFields || sections.length === 0))
    return (
      <Alert variant="destructive" className="max-w-4xl mx-auto mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Metadata Error</AlertTitle>
        <AlertDescription>{error || 'Error whilst fetching metadata'}</AlertDescription>
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
          view={view}
          apis={apis}
          attachmentGuid={attachmentGuid}
          formFields={formFields!}
          uiActions={uiActions}
          formConfig={formConfig!}
          clientScripts={clientScripts}
          uiPolicies={uiPolicies}
          sections={sections}
          activity={activity}
          attachments={attachments}
          scratchpad={scratchpad}
          messages={messages}
          setAttachments={setAttachments}
          snInsert={snInsert}
          snSubmit={handleSubmit}
        ></SnForm>
      )}
    </>
  )
}
