import { Button } from '../../ui/button'
import { useUiActions } from '../contexts/SnUiActionContext'
import { SnAttachment } from '../../../types/attachment-schema'
import { SnAttachments } from '../../sn-ui/sn-attachments/sn-form-attachments'
import { useFormLifecycle } from '../../sn-form/contexts/SnFormLifecycleContext'

interface SnFormActionsProps {
  table: string
  attachments: SnAttachment[] | null
  attachmentGuid: string
  setAttachments: (attachments: SnAttachment[]) => void
}

export function SnFormActions({ table, attachments, attachmentGuid, setAttachments }: SnFormActionsProps) {
  const { formConfig } = useFormLifecycle()
  const { handleUiAction, uiActions, loadingActionId } = useUiActions()

  const canWrite = formConfig.security.canWrite ?? false
  const canDelete = formConfig.security.canDelete ?? false

  return (
    <div className="mt-6 flex justify-center flex-wrap gap-2">
      {!!attachments && (
        <SnAttachments
          table={table}
          guid={attachmentGuid}
          canWrite={canWrite}
          canDelete={canDelete}
          baseUrl={formConfig.base_url}
          attachments={attachments}
          setAttachments={setAttachments}
        />
      )}
      {uiActions
        .filter(a => a.is_button)
        .map(action => (
          <Button
            key={action.sys_id}
            type="button"
            onClick={() => handleUiAction(action)}
            disabled={!!loadingActionId}
            variant={action.primary ? 'default' : 'outline'}
          >
            {loadingActionId === action.sys_id ? 'Processing...' : action.name}
          </Button>
        ))}
    </div>
  )
}
