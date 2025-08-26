import { Card, CardContent, CardFooter } from '../../components/ui/card'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Mail, Phone, MessageSquareMore } from 'lucide-react'
import SnAvatar from './sn-avatar'

interface SnUserCardProps {
  name: string
  email: string
  primaryInfo: string
  phone?: string
  image?: string
  im?: string
  secondaryInfo?: string
  initials?: string
}

export function SnUserCard({ name, email, phone, im, image, primaryInfo, initials }: SnUserCardProps) {
  return (
    <Card className="w-full h-full gap-0 p-0 rounded-md">
      <CardContent className="flex p-4 gap-4 items-center sn-user-info">
        <SnAvatar name={name} image={image || ''} className="size-12" initials={initials || ''} />
        <div className="flex flex-col min-w-0">
          <h3 className="text-md font-semibold break-words pr-4">{name}</h3>
          <p className="text-sm text-muted-foreground break-words">{primaryInfo}</p>
        </div>
      </CardContent>
      <Separator className="mt-auto sn-user-seperator"/>
      <CardFooter className="flex justify-between items-center p-2">
        {email && (
          <>
            <Button variant="ghost" className="flex-1 sn-user-email-button" asChild>
              <a href={`mailto:${email}`} target="_blank">
                <Mail /> Email
              </a>
            </Button>
          </>
        )}

        {im && (
          <>
            <Separator orientation="vertical" className="!h-auto self-stretch" />
            <Button variant="ghost" className="flex-1 sn-user-im-button" asChild>
              <a href={im} target="_blank">
                <MessageSquareMore /> IM
              </a>
            </Button>
          </>
        )}

        {phone && (
          <>
            <Separator orientation="vertical" className="!h-auto self-stretch" />
            <Button variant="ghost" className="flex-1 sn-user-phone-button" asChild>
              <a href={`tel:${phone}`}>
                <Phone /> Call
              </a>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
