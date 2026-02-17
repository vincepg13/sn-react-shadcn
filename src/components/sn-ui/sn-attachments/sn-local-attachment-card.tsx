import { Button } from '@kit/components/ui/button'
import { Card, CardContent } from '@kit/components/ui/card'
import { Trash } from 'lucide-react'

type LocalCardProps = {
  file: File
  onDelete: () => void
}

export function SnLocalAttachmentCard({ file, onDelete }: LocalCardProps) {
  return (
    <Card className="py-2">
      <CardContent className="px-3">
        <div className="flex items-center gap-2">
          <span className="break-all text-sm">{file.name}</span>
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="outline" className="text-red-500" size="icon" onClick={onDelete}>
              <Trash />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
