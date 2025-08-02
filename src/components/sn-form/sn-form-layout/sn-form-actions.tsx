import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../ui/button'
import { FieldErrors } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'
import { SnAttachment } from '../../../types/attachment-schema'
import { SnAttachments } from '../../sn-ui/sn-attachments/sn-form-attachments'
import { useFormLifecycle } from '../../sn-form/contexts/SnFormLifecycleContext'
import { SnUiAction, SnFieldsSchema, SnUiResponse } from '../../../types/form-schema'
import { buildSubmissionPayload, triggerNativeUIAction } from '../../../utils/form-client'

interface SnFormActionsProps {
  table: string
  recordID: string
  uiActions: SnUiAction[]
  formFields: SnFieldsSchema
  attachments: SnAttachment[]
  attachmentGuid: string
  setAttachments: (attachments: SnAttachment[]) => void
  handleSubmit: ReturnType<typeof useFormContext>['handleSubmit']
  onValidationError: (errors: FieldErrors) => void
  runUiActionCallbacks: (type: 'pre' | 'post') => Promise<void>
  snSubmit(guid: string): void
  snInsert?(guid: string): void
}

export function SnFormActions({
  table,
  recordID,
  uiActions,
  formFields,
  attachments,
  attachmentGuid,
  snInsert,
  snSubmit,
  handleSubmit,
  setAttachments,
  onValidationError,
  runUiActionCallbacks,
}: SnFormActionsProps) {
  const { getValues } = useFormContext()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { formConfig } = useFormLifecycle()
  const canWrite = formConfig.security.canWrite ?? false
  const canDelete = formConfig.security.canDelete ?? false

  const handleUiAction = async (action: SnUiAction) => {
    try {
      setIsLoading(action.sys_id)

      await runUiActionCallbacks('pre')
      const values = getValues()
      const payload = buildSubmissionPayload(formFields, values)

      const uiResponse = await triggerNativeUIAction({
        table,
        recordID,
        attachmentGuid,
        actionSysId: action.sys_id,
        data: payload,
      })

      await runUiActionCallbacks('post')

      const uiRes = uiResponse.result as SnUiResponse

      if (uiRes?.isActionAborted) {
        let notif = 'UI Action was aborted'

        let errors = uiRes.$$uiNotification ?? []
        errors = errors.filter(e => e.type === 'error')
        notif = errors.length > 0 ? errors[0].message : notif

        return toast.error(notif)
      }

      if (snInsert && uiRes?.isInsert) {
        return snInsert(uiRes.sys_id)
      }

      snSubmit(uiRes.sys_id)
      toast.success(`${action.name} executed successfully`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to execute UI Action')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="mt-6 flex justify-center flex-wrap gap-2">
      <SnAttachments
        table={table}
        guid={attachmentGuid}
        canWrite={canWrite}
        canDelete={canDelete}
        baseUrl={formConfig.base_url}
        attachments={attachments}
        setAttachments={setAttachments}
      />
      {uiActions
        .filter(a => a.is_button)
        .map(action => (
          <Button
            key={action.sys_id}
            type="button"
            onClick={() => handleSubmit(() => handleUiAction(action), onValidationError)()}
            disabled={!!isLoading}
            variant={action.primary ? 'default' : 'outline'}
          >
            {isLoading === action.sys_id ? 'Processing...' : action.name}
          </Button>
        ))}
    </div>
  )
}
