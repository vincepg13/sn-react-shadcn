import { Card, CardContent } from '@kit/components/ui/card'
// import { Avatar, AvatarFallback } from '@kit/components/ui/avatar'
import { Badge } from '@kit/components/ui/badge'
import { Clock } from 'lucide-react'
import { SnActivityEntry } from '@kit/types/form-schema'
// import SnAvatar from '@kit/components/sn-user/sn-avatar'

export function SnActivityCard({entry, colour}: {entry: SnActivityEntry, colour?: string}) {
  const badgeStyle = {
    color: colour && colour != "transparent" ? 'white' : 'inherit',
    backgroundColor: colour
  }

  return (
    <Card className="w-full p-0">
      <CardContent className="py-3 px-4 space-y-2">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm ">{entry.name}</span>
          <Badge style={badgeStyle} variant="outline">{entry.field_label}</Badge>
          <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={16} />
            <span>{entry.sys_created_on_adjusted}</span>
          </div>
        </div>

        <p className="text-sm">{entry.value}</p>
        {/* Optional: render attachment or file */}
      </CardContent>
    </Card>
  )
}
