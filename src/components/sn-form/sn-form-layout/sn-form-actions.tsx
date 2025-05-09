import { FieldErrors } from 'react-hook-form'
import { Button } from '../../ui/button'
import { useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import { SnUiAction, SnFieldsSchema } from '../../../types/form-schema'
import { buildSubmissionPayload, triggerNativeUIAction } from '../../../utils/form-client'
import { useState } from 'react'

interface SnFormActionsProps {
  table: string
  recordID: string
  uiActions: SnUiAction[]
  formFields: SnFieldsSchema
  handleSubmit: ReturnType<typeof useFormContext>['handleSubmit']
  onValidationError: (errors: FieldErrors) => void
}

export function SnFormActions({
  table,
  recordID,
  uiActions,
  formFields,
  handleSubmit,
  onValidationError,
}: SnFormActionsProps) {
  const { getValues } = useFormContext()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleUiAction = async (action: SnUiAction) => {
    try {
      setIsLoading(action.sys_id)

      const values = getValues()
      const payload = buildSubmissionPayload(formFields, values)

      await triggerNativeUIAction({
        table,
        recordID,
        actionSysId: action.sys_id,
        data: payload,
      })

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
