import { FieldErrors } from 'react-hook-form'
import { Button } from '../../ui/button'
import { useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import { SnUiAction, SnFieldsSchema, SnAttachment } from '../../../types/form-schema'
import { buildSubmissionPayload, triggerNativeUIAction } from '../../../utils/form-client'
import { useState } from 'react'
import { SnAttachments } from '../../sn-ui/sn-attachments/sn-form-attachments'

interface SnFormActionsProps {
  table: string
  recordID: string
  uiActions: SnUiAction[]
  formFields: SnFieldsSchema
  attachments: SnAttachment[]
  setAttachments: (attachments: SnAttachment[]) => void
  handleSubmit: ReturnType<typeof useFormContext>['handleSubmit']
  onValidationError: (errors: FieldErrors) => void
  runUiActionCallbacks: (type: 'pre' | 'post') => Promise<void>
}

export function SnFormActions({
  table,
  recordID,
  uiActions,
  formFields,
  attachments,
  handleSubmit,
  setAttachments,
  onValidationError,
  runUiActionCallbacks,
}: SnFormActionsProps) {
  const { getValues } = useFormContext()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleUiAction = async (action: SnUiAction) => {
    try {
      setIsLoading(action.sys_id)

      await runUiActionCallbacks('pre')
      const values = getValues()
      const payload = buildSubmissionPayload(formFields, values)

      await triggerNativeUIAction({
        table,
        recordID,
        actionSysId: action.sys_id,
        data: payload,
      })

      await runUiActionCallbacks('post')

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
      <SnAttachments table={table} guid={recordID} attachments={attachments} setAttachments={setAttachments} />
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
