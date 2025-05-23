import { isAxiosError } from 'axios'
import { useEffect, useRef } from 'react'
import { Paperclip } from 'lucide-react'
import { SnDropzone } from './sn-dropzone'
import { Button } from '@kit/components/ui/button'
import { SnAttachment } from '@kit/types/form-schema'
import { SnAttachmentCard } from './sn-attachment-card'
import { useFormLifecycle } from '../../sn-form/contexts/SnFormLifecycleContext'
import { deleteAttachment, uploadAttachment } from '@kit/utils/attachment-api'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@kit/components/ui/sheet'

type AttacherProps = {
  table: string
  guid: string
  attachments: SnAttachment[]
  setAttachments: (attachments: SnAttachment[]) => void
}

export function SnAttachments({ table, guid, attachments, setAttachments }: AttacherProps) {
  const { formConfig } = useFormLifecycle()
  const canWrite = formConfig.security.canWrite ?? false
  const canDelete = formConfig.security.canDelete ?? false
  const abortRef = useRef<AbortController | null>(null)

  const handleDeleteAttachment = async (attachmentId: string) => {
    const res = await deleteAttachment(attachmentId)
    if (res) {
      setAttachments(attachments.filter(a => a.sys_id !== attachmentId))
    }
  }

  const handleFilesSaved = async (acceptedFiles: File[]) => {
    const uploaded: SnAttachment[] = []

    for (const file of acceptedFiles) {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const result = await uploadAttachment(file, table, guid, '', controller)
        uploaded.push({ ...result, url: `${formConfig.base_url}/sys_attachment.do?sys_id=${result.url}` })
      } catch (err) {
        if (isAxiosError(err) && err.name === 'AbortError') {
          console.log('Upload aborted')
          break
        } else {
          console.error('Upload error:', err)
        }
      }
    }

    setAttachments([...attachments, ...uploaded])
  }

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline">
          <Paperclip />
          {!!attachments.length && attachments.length}
        </Button>
      </SheetTrigger>
      <SheetContent className="max-w-[400px] lg:max-w-[450px] xl:max-w-[500px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Attachments</SheetTitle>
          <SheetDescription>
            You can view or modify attachments here. When adding new attachments make sure you click the upload button.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="grid gap-4">
            {attachments.map(attachment => (
              <SnAttachmentCard
                attachment={attachment}
                canDelete={canDelete}
                onDelete={handleDeleteAttachment}
                key={attachment.sys_id}
              />
            ))}
          </div>
        </div>

        {canWrite && (
          <SheetFooter>
            <SheetClose asChild>
              <SnDropzone onFileSave={handleFilesSaved} />
            </SheetClose>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
