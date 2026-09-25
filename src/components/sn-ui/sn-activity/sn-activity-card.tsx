import { Card, CardContent } from '@kit/components/ui/card'
// import { Avatar, AvatarFallback } from '@kit/components/ui/avatar'
import { Badge } from '@kit/components/ui/badge'
import { Clock } from 'lucide-react'
import { SnActivityEntry } from '@kit/types/form-schema'
import { ReactNode } from 'react'
// import SnAvatar from '@kit/components/sn-user/sn-avatar'

function getEntryItem(entry: SnActivityEntry): {node: ReactNode, label: string} {
  if (entry.element === 'attachment' && entry.attachment) {
    return {
      node: (
        <a className="text-sm underline" href={`sys_attachment.do?sys_id=${entry.attachment.sys_id}`}>
          {entry.attachment.file_name}
        </a>
      ),
      label: "Attachment uploaded"
    }
  }

  return {
    node: <p className="text-sm whitespace-pre-wrap">{entry.value}</p>,
    label: entry.field_label
  }
}

export function SnActivityCard({entry, colour}: {entry: SnActivityEntry, colour?: string}) {
  const badgeColour = colour?.replace("background-color: ", "")
  const badgeStyle = {
    color: badgeColour && badgeColour != "transparent" ? 'white' : 'inherit',
    backgroundColor: badgeColour
  }

  const {node, label} = getEntryItem(entry);

  return (
    <Card className="w-full p-0">
      <CardContent className="py-3 px-4 space-y-2">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm">{entry.name}</span>
          <Badge style={badgeStyle} variant="outline">{label}</Badge>
          <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={16} />
            <span>{entry.sys_created_on_adjusted}</span>
          </div>
        </div>

        {node}
      </CardContent>
    </Card>
  )
}
