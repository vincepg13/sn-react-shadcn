import { Button } from '../../components/ui/button'
import { useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import { SnUiAction, SnFieldsSchema } from '../../types/form-schema'
import { buildSubmissionPayload, triggerNativeUIAction } from '../../utils/form-client'
import { useState } from 'react'
import { forwardRef, useImperativeHandle } from 'react'

interface SnFormActionsProps {
  table: string
  recordID: string
  uiActions: SnUiAction[]
  formFields: SnFieldsSchema
}


export interface SnFormActionsRef {
  triggerPrimaryAction: () => void
}

export const SnFormActions = forwardRef<SnFormActionsRef, SnFormActionsProps>(
  ({ table, recordID, uiActions, formFields }, ref) => {
    const { handleSubmit, getValues } = useFormContext()
    const [isLoading, setIsLoading] = useState<string | null>(null)

    const handleUiAction = (action: SnUiAction) =>
      handleSubmit(async () => {
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
      })()

    useImperativeHandle(ref, () => ({
      triggerPrimaryAction: () => {
        const primaryAction = uiActions.find(action => action.primary)
        if (primaryAction) {
          handleUiAction(primaryAction)
        } else {
          toast.error('No primary action defined')
        }
      },
    }))

    return (
      <div className="mt-6 flex flex-wrap gap-2">
        {uiActions
          .filter(a => a.is_button)
          .map(action => (
            <Button
              key={action.sys_id}
              type="button"
              onClick={() => handleUiAction(action)}
              disabled={!!isLoading}
              variant={action.primary ? 'default' : 'outline'}
            >
              {isLoading === action.sys_id ? 'Processing...' : action.name}
            </Button>
          ))}
      </div>
    )
  }
)
