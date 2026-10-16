import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { CircleHelp } from 'lucide-react'
import { Alert, AlertDescription } from '../../ui/alert'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../ui/hover-card'
import type { HintDisplayType } from '../../../types/form-schema'

type SnFieldHintProps = {
  content: string
  display: HintDisplayType
  expanded: boolean
  helpLabel?: string
  id: string
  label: string
  onExpandedChange: (expanded: boolean) => void
}

export function SnFieldHintTrigger({
  content,
  display,
  expanded,
  helpLabel,
  id,
  label,
  onExpandedChange,
}: SnFieldHintProps) {
  if (display === 'hover') {
    return (
      <HoverCard openDelay={100}>
        <HoverCardTrigger asChild>
          <span
            tabIndex={0}
            aria-label={helpLabel || `Hint for ${label}`}
            className="ml-1 inline-flex cursor-help text-muted-foreground"
          >
            <CircleHelp className="size-3.5" aria-hidden />
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="text-sm whitespace-pre-wrap">{content}</HoverCardContent>
      </HoverCard>
    )
  }

  if (display !== 'collapsibleAlert') return null

  return (
    <button
      type="button"
      aria-controls={id}
      aria-expanded={expanded}
      aria-label={helpLabel || `Toggle help for ${label}`}
      title={helpLabel}
      className="ml-1 inline-flex cursor-pointer text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={event => {
        // The trigger sits beside the field text inside FormLabel. Prevent the
        // label from forwarding this click to the input as well.
        event.preventDefault()
        event.stopPropagation()
        onExpandedChange(!expanded)
      }}
    >
      <CircleHelp className="size-3.5" aria-hidden />
    </button>
  )
}

export function SnFieldHintContent({ content, display, expanded, helpLabel, id }: SnFieldHintProps) {
  const sanitizedContent = useMemo(
    () =>
      DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          'a',
          'b',
          'blockquote',
          'br',
          'code',
          'em',
          'i',
          'li',
          'ol',
          'p',
          'pre',
          's',
          'span',
          'strong',
          'u',
          'ul',
        ],
        ALLOWED_ATTR: ['href', 'title'],
      }),
    [content]
  )

  if (display === 'hover' || (display === 'collapsibleAlert' && !expanded)) return null

  return (
    <Alert
      id={id}
      role="region"
      aria-label={helpLabel || 'Field help'}
      className="flex items-start gap-2 border-muted-foreground/20 bg-muted/50 px-3 py-2 text-muted-foreground"
    >
      <span className="mt-0.5 inline-flex shrink-0">
        <CircleHelp className="size-4" aria-hidden />
      </span>
      {display === 'collapsibleAlert' ? (
        <AlertDescription
          className="leading-5 text-muted-foreground [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_li]:ml-5 [&_ol]:list-decimal [&_p+p]:mt-2 [&_pre]:whitespace-pre-wrap [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      ) : (
        <AlertDescription className="leading-5 whitespace-pre-wrap text-muted-foreground">
          {content}
        </AlertDescription>
      )}
    </Alert>
  )
}
