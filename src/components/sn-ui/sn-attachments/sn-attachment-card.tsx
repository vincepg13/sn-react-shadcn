import { useState } from 'react'
import { Button } from '@kit/components/ui/button'
import { SnAttachment } from '@kit/types/attachment-schema'
import { Card, CardContent } from '@kit/components/ui/card'
import { Trash, Download, LoaderCircle } from 'lucide-react'

type CardProps = {
  attachment: SnAttachment
  canDelete: boolean
  onDelete: (attachment: string) => Promise<void>
}

export function SnAttachmentCard({ attachment, canDelete, onDelete }: CardProps) {
  const [isDeleting, setIsDeleting] = useState('')

  const handleDelete = async (attID: string) => {
    if (isDeleting) return
    try {
      setIsDeleting(attID)
      await onDelete(attID)
    } finally {
      setIsDeleting('')
    }
  }

  return (
    <Card key={attachment.sys_id} className="py-2">
      <CardContent className="px-3">
        <div className="flex items-center gap-2">
          <span className="break-all text-sm">{attachment.file_name}</span>
          <div className="ml-auto flex items-center gap-2">
            {canDelete && <Button
              type="button"
              variant="outline"
              className="text-red-500"
              size="icon"
              disabled={isDeleting === attachment.sys_id}
              onClick={() => handleDelete(attachment.sys_id)}
            >
              {isDeleting === attachment.sys_id ? <LoaderCircle className="animate-spin" /> : <Trash />}
            </Button>}
            <Button type="button" variant="outline" size="icon" asChild>
              <a href={attachment.url}>
                <Download />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}