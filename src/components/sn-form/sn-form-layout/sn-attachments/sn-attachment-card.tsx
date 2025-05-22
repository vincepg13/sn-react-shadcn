import { Card, CardContent } from '@kit/components/ui/card'
import { SnAttachment } from '@kit/types/form-schema'
import { Trash, Download, LoaderCircle } from 'lucide-react'
import { Button } from '@kit/components/ui/button'
import { useState } from 'react'

type CardProps = {
  attachment: SnAttachment
  onDelete: (attachment: string) => Promise<void>
}

export function SnAttachmentCard({ attachment, onDelete }: CardProps) {
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
    <Card key={attachment.id} className="py-2">
      <CardContent className="px-3">
        <div className="flex items-center gap-2">
          <span className="break-all text-sm">{attachment.file_name}</span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="text-red-500"
              size="icon"
              disabled={isDeleting === attachment.id}
              onClick={() => handleDelete(attachment.id)}
            >
              {isDeleting === attachment.id ? <LoaderCircle className="animate-spin" /> : <Trash />}
            </Button>
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
