import { Button } from '@kit/components/ui/button'
import { SnAttachment } from '@kit/types/form-schema'
import { SnAttachmentCard } from './sn-attachment-card'
// import { useFormLifecycle } from '../../contexts/SnFormLifecycleContext'
import { Paperclip } from 'lucide-react'
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
import { SnDropzone } from './sn-dropzone'
import { deleteAttachment } from '@kit/utils/attachment-api'

type AttacherProps = { attachments: SnAttachment[]; setAttachments: (attachments: SnAttachment[]) => void }

export function SnFormAttacher({ attachments, setAttachments }: AttacherProps) {
  // const { formConfig, registerPreUiActionCallback } = useFormLifecycle()
  // console.log("ATT FORM CONFIG", formConfig)

  const handleDeleteAttachment = async (attachmentId: string) => {
    const res = await deleteAttachment(attachmentId)
    if (res) {
      setAttachments(attachments.filter(a => a.id !== attachmentId))
    }
  }

  const handleFileChanges = async (acceptedFiles: File[]) => {
    console.log('ACCEPTED FILES', acceptedFiles)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline">
          <Paperclip />
          {!!attachments.length && attachments.length}
        </Button>
      </SheetTrigger>
      <SheetContent className="max-w-[400px] lg:max-w-[450px] xl:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>Attachments</SheetTitle>
          <SheetDescription>
            You can view or modify attachments here. When adding new attachments make sure you click the upload button.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4">
          {attachments.map(attachment => (
            <SnAttachmentCard attachment={attachment} onDelete={handleDeleteAttachment} key={attachment.id} />
          ))}
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <SnDropzone onFileSave={handleFileChanges} />
            {/* <Button type="submit">Save changes</Button> */}
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
