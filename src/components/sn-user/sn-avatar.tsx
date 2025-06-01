import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { cn } from '../../lib/utils'

interface SnAvatarProps {
  name: string
  image?: string
  initials?: string
  className?: string
}

function getInitials(name: string): string {
  let initials = name
    .split(' ')
    .filter(Boolean) // remove extra spaces
    .map(word => word[0]?.toUpperCase())

  initials = initials.length > 2 ? [initials[0], initials[initials.length - 1]] : initials
  return initials.join('')
}

export default function SnAvatar({ name, initials, image, className }: SnAvatarProps) {
  const [fallback, setFallback] = useState(initials || getInitials(name))

  useEffect(() => {
    setFallback(initials || getInitials(name))
  }, [name, initials])

  return (
    <Avatar className={cn('size-12', className)}>
      <AvatarImage src={image} className="object-cover" />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  )
}
