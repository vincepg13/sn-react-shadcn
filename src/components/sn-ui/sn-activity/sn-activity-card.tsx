import { Card, CardContent } from '@kit/components/ui/card'
// import { Avatar, AvatarFallback } from '@kit/components/ui/avatar'
import { Badge } from '@kit/components/ui/badge'
import { Clock } from 'lucide-react'
import { SnActivityEntry } from '@kit/types/form-schema'
import SnAvatar from '@kit/components/sn-user/sn-avatar'

export function SnActivityCard({entry}: {entry: SnActivityEntry}) {
  return (
    <Card className="w-full p-0">
      <CardContent className="py-3 px-4 space-y-1">
        <div className="flex gap-2 items-center flex-wrap">
          <SnAvatar name={entry.name} initials={entry.initials} image={entry.user_img} className="size-9"/>
          <span className="text-sm ">{entry.name}</span>
          <Badge variant="outline">{entry.field_label}</Badge>
          <div className="ml-auto text-sm text-muted-foreground flex items-center gap-1">
            <Clock size={18} />
            <span>{entry.sys_created_on_adjusted}</span>
          </div>
        </div>

        <p className="text-sm">{entry.value}</p>

        {/* Optional: render attachment or file */}
      </CardContent>
    </Card>
  )
}
