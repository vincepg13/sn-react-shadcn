import { SnAttachment } from '@kit/types/attachment-schema'
import { getAttachments } from '@kit/utils/attachment-api'
import { useState, useEffect, forwardRef } from 'react'
import { SnAttachments, SnAttachmentsRef } from './sn-form-attachments'
import { errorHandler } from '@kit/lib/utils'

type ClippyProps = {
  table: string
  guid: string
  instance?: string
  saveMode?: 'internal' | 'external'
}

export type SnClippyRef = SnAttachmentsRef

export const SnClippy = forwardRef<SnClippyRef, ClippyProps>(function SnClippy(
  { table, guid, instance, saveMode = 'internal' },
  ref
) {
  const baseUrl = instance || window.location.origin
  const [attachments, setAttachments] = useState<SnAttachment[]>([])
  const [canWrite, setCanWrite] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const fetchAttachments = async () => {
      try {
        const aList = (await getAttachments(table, guid, controller)) || []
        setAttachments(aList)
        setCanWrite(!aList.some(a => !a.canWrite))
      } catch (error) {
        errorHandler(error, 'Failed to fetch attachments')
      }
    }

    fetchAttachments()

    return () => controller.abort()
  }, [table, guid])

  return (
    <SnAttachments
      ref={ref}
      table={table}
      guid={guid}
      baseUrl={baseUrl}
      canWrite={canWrite}
      saveMode={saveMode}
      attachments={attachments}
      setAttachments={setAttachments}
    />
  )
})
