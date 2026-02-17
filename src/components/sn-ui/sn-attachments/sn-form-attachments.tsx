import { isAxiosError } from 'axios'
import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import { Paperclip } from 'lucide-react'
import { SnDropzone } from './sn-dropzone'
import { Button } from '@kit/components/ui/button'
import { SnAttachmentCard } from './sn-attachment-card'
import { SnLocalAttachmentCard } from './sn-local-attachment-card'
import { SnAttachment } from '@kit/types/attachment-schema'
import { deleteAttachment, uploadAttachment } from '@kit/utils/attachment-api'
import { errorHandler } from '@kit/lib/utils'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@kit/components/ui/sheet'

export type SnAttachmentsSaveOptions = {
  guid?: string
}

export type SnAttachmentsRef = {
  save: (options?: SnAttachmentsSaveOptions) => Promise<void>
  clearPending: () => void
  hasPending: () => boolean
}

type AttacherProps = {
  table: string
  guid: string
  attachments: SnAttachment[]
  baseUrl: string
  canWrite?: boolean
  canDelete?: boolean
  saveMode?: 'internal' | 'external'
  setAttachments: (attachments: SnAttachment[]) => void
}

export const SnAttachments = forwardRef<SnAttachmentsRef, AttacherProps>(function SnAttachments(
  {
    table,
    guid,
    canWrite,
    canDelete,
    baseUrl,
    attachments,
    saveMode = 'internal',
    setAttachments,
  },
  ref
) {
  const abortRef = useRef<AbortController | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const isExternalSave = saveMode === 'external'

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId)
      setAttachments(attachments.filter(a => a.sys_id !== attachmentId))
    } catch (error) {
      errorHandler(error, 'Failed to delete attachment')
    }
  }

  const removePendingFile = (fileToRemove: File, index: number) => {
    setFiles(prev => prev.filter((file, i) => i !== index || file !== fileToRemove))
  }

  const saveFiles = async (overrideGuid?: string) => {
    if (isSaving || !files.length) return

    const uploaded: SnAttachment[] = []
    const saveGuid = overrideGuid || guid

    setIsSaving(true)

    try {
      for (const file of files) {
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        try {
          const result = await uploadAttachment(file, table, saveGuid, '', controller)
          if (result && typeof result === 'object') {
            uploaded.push({ ...result, url: `${baseUrl}/sys_attachment.do?sys_id=${result.url}` })
          }
        } catch (err) {
          if (isAxiosError(err) && err.name === 'AbortError') {
            break
          } else {
            errorHandler(err, 'Failed to upload attachment')
          }
        }
      }
    } finally {
      setIsSaving(false)
    }

    if (uploaded.length) {
      setAttachments([...attachments, ...uploaded])
    }

    setFiles([])
  }

  useImperativeHandle(ref, () => ({
    save: async options => {
      await saveFiles(options?.guid)
    },
    clearPending: () => setFiles([]),
    hasPending: () => files.length > 0,
  }))

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline">
          <Paperclip />
          {!!(isExternalSave ? files.length : attachments.length) && (isExternalSave ? files.length : attachments.length)}
        </Button>
      </SheetTrigger>
      <SheetContent className="max-w-[400px] lg:max-w-[450px] xl:max-w-[500px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Attachments</SheetTitle>
          <SheetDescription>
            {isExternalSave
              ? 'Selected files to upload will be shown here.'
              : 'You can view or modify attachments here. When adding new attachments make sure you click the upload button.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="grid gap-4">
            {isExternalSave
              ? files.map((file, index) => (
                <SnLocalAttachmentCard
                  key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                  file={file}
                  onDelete={() => removePendingFile(file, index)}
                />
              ))
              : attachments.map(attachment => (
                <SnAttachmentCard
                  attachment={attachment}
                  key={attachment.sys_id}
                  onDelete={handleDeleteAttachment}
                  canDelete={canDelete || attachment.canDelete || false}
                />
              ))}
          </div>
        </div>

        {canWrite && (
          <SheetFooter>
            <SnDropzone
              files={files}
              onFilesChange={setFiles}
              onFileSave={() => saveFiles()}
              isSaving={isSaving}
              showActionRow={saveMode === 'internal'}
            />
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
})
