import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { cn } from '../../lib/utils';

interface SnAvatarProps {
  name: string
  image: string
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean) // remove extra spaces
    .map(word => word[0]?.toUpperCase())
    .join('')
}


export default function SnAvatar({ name, image, className }: SnAvatarProps) {
  const [fallback, setFallback] = useState(getInitials(name))
  
  useEffect(() => {
    setFallback(getInitials(name))
  }, [name])
  
  return (
    <Avatar className={cn("size-12", className)}>
      <AvatarImage src={image} className="object-cover" />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  )
}
