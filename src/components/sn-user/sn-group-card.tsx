import SnAvatar from './sn-avatar'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { SnGroup } from '../../types/user-schema'
import { SnSimplePagination } from '../sn-table/sn-simple-pagination'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { MailIcon, PhoneIcon, MessageSquareIcon, MessagesSquare } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu'

interface SnGroupCardProps extends SnGroup {
  totalMembers: number
  currentPage: number
  pageSize: number
  nested?: boolean
  onPageChange: (page: number) => void
}

interface GroupMemberProps {
  name: string
  email: string
  image?: string
  im?: string
  phone?: string
  nested?: boolean
}

function GroupMember({ name, email, image, im, phone, nested }: GroupMemberProps) {
  const hasContactOptions = email || phone || im

  return (
    <div className="flex gap-4 items-center justify-between">
      <div className="flex gap-4 items-center">
        <SnAvatar name={name} image={image || ''} className="size-9" />
        <div>
          <p className="text-sm font-medium break-words break-all whitespace-normal">{name}</p>
          <p className="text-sm text-muted-foreground break-words break-all whitespace-normal">{email}</p>
        </div>
      </div>

      {hasContactOptions && (
        <DropdownMenu modal={!nested}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MessagesSquare className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {email && (
              <DropdownMenuItem asChild>
                <a href={`mailto:${email}`}>
                  <MailIcon className="mr-2 h-4 w-4" />
                  Email
                </a>
              </DropdownMenuItem>
            )}
            {phone && (
              <DropdownMenuItem asChild>
                <a href={`tel:${phone}`}>
                  <PhoneIcon className="mr-2 h-4 w-4" />
                  Phone
                </a>
              </DropdownMenuItem>
            )}
            {im && (
              <DropdownMenuItem asChild>
                <a href={im} target="_blank" rel="noopener noreferrer">
                  <MessageSquareIcon className="mr-2 h-4 w-4" />
                  Instant Message
                </a>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

export function SnGroupCard({
  name,
  description,
  manager,
  members,
  totalMembers,
  currentPage,
  pageSize,
  nested,
  onPageChange,
}: SnGroupCardProps) {
  const totalPages = Math.ceil(totalMembers / pageSize)

  return (
    <Card className="h-full w-full gap-4 py-6 rounded-md">
      <CardHeader className="px-4">
        <CardTitle>{name}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      {manager && (
        <CardContent className="px-4 overflow-x-auto sn-group-manager">
          <GroupMember
            name={manager.name}
            email={manager.email}
            image={manager.image}
            im={manager.im}
            phone={manager.phone}
            nested={nested}
          />
        </CardContent>
      )}

      {(manager || !!members?.length) && <Separator className="sn-group-seperator"/>}

      {!!members?.length && (
        <CardContent className="px-4 overflow-x-auto sn-group-members flex flex-col gap-4">
          {members.map((member, index) => (
            <div key={index}>
              <GroupMember
                name={member.name}
                email={member.email}
                image={member.image}
                im={member.im}
                phone={member.phone}
                nested={nested}
              />
            </div>
          ))}
        </CardContent>
      )}

      {totalPages > 1 && (
        <CardContent className="px-4 sn-group-pagination">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <SnSimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            ></SnSimplePagination>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
