import { SnAttachment } from '@kit/types/attachment-schema'
import { getAttachments } from '@kit/utils/attachment-api'
import { useState, useEffect, useRef } from 'react'
import { SnAttachments } from './sn-form-attachments'

type ClippyProps = {
  table: string
  guid: string
  instance?: string
}

export function SnClippy({ table, guid, instance }: ClippyProps) {
  const baseUrl = instance || window.location.origin
  const [attachments, setAttachments] = useState<SnAttachment[]>([])
  let canWrite = useRef(false)

  useEffect(() => {
    const fetchAttachments = async () => {
      const aList = (await getAttachments(table, guid)) || []
      setAttachments(aList)
      canWrite.current = !aList.some(a => !a.canWrite)
    }
    fetchAttachments()
  }, [table, guid])

  return (
    <SnAttachments
      table={table}
      guid={guid}
      baseUrl={baseUrl}
      canWrite={canWrite.current}
      attachments={attachments}
      setAttachments={setAttachments}
    />
  )
}
