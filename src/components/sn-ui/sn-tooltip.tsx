import { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

export function SnSimpleTooltip({ content, children }: { content?: string | null; children: ReactNode }) {
  const hasContent = typeof content === 'string' && content.trim().length > 0

  if (!hasContent) {
    return <>{children}</>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  )
}
