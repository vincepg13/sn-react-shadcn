import { useMemo, type MouseEvent } from 'react'
import DOMPurify from 'dompurify'
import { Download, FileText, Paperclip } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { cn } from '../../lib/utils'
import { getKnowledgeAttachmentUrl } from '../../utils/knowledge-api'
import type { SnKbArticle, SnKbAttachment } from '../../types/knowledge-schema'

export type SnKbAttachmentUrlResolver = (attachment: SnKbAttachment, article: SnKbArticle) => string

export type SnKbAttachmentClickHandler = (
  attachment: SnKbAttachment,
  article: SnKbArticle,
  event: MouseEvent<HTMLAnchorElement>
) => void

export interface SnKbContentViewerProps {
  article: SnKbArticle
  className?: string
  getAttachmentUrl?: SnKbAttachmentUrlResolver
  onAttachmentClick?: SnKbAttachmentClickHandler
}

function formatAttachmentSize(size: string) {
  const bytes = Number(size)
  if (!Number.isFinite(bytes) || bytes < 0) return size
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex

  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: unitIndex === 0 ? 0 : 1 }).format(value)} ${units[unitIndex]}`
}

function formatAttachmentState(state: SnKbAttachment['state']) {
  return state
    .split('_')
    .map((word, index) => (index === 0 ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word))
    .join(' ')
}

function canDownloadAttachment(attachment: SnKbAttachment) {
  return attachment.state === 'available' || attachment.state === 'available_conditionally'
}

export function SnKbContentViewer({
  article,
  className,
  getAttachmentUrl = (attachment, currentArticle) =>
    getKnowledgeAttachmentUrl(currentArticle.sys_id, attachment.sys_id),
  onAttachmentClick,
}: SnKbContentViewerProps) {
  const sanitizedContent = useMemo(
    () =>
      DOMPurify.sanitize(article.content, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['target'],
      }),
    [article.content]
  )

  const showAttachments = article.display_attachments && article.attachments.length > 0

  return (
    <Card className={cn('sn-kb-content-viewer w-full gap-0 overflow-hidden rounded-md py-0', className)}>
      <CardHeader className="gap-3 border-b px-4 py-5 sm:px-6">
        <div className="flex min-w-0 flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
          <CardTitle className="min-w-0 text-xl leading-tight sm:text-2xl">
            {article.short_description.trim() || 'Knowledge article'}
          </CardTitle>
          {article.number && (
            <Badge variant="secondary" className="font-mono">
              {article.number}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 py-6 sm:px-6">
        {sanitizedContent ? (
          <div
            className={cn(
              'sn-kb-article-content max-w-none overflow-x-auto text-sm leading-7 text-foreground sm:text-base',
              '[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4',
              '[&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic',
              '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm',
              '[&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight',
              '[&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight',
              '[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold',
              '[&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:text-lg [&_h4]:font-semibold',
              '[&_h1:first-child]:mt-0 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0',
              '[&_hr]:my-6 [&_hr]:border-border',
              '[&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md',
              '[&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6',
              '[&_p]:my-4 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
              '[&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4',
              '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
              '[&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left',
              '[&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:p-2 [&_th]:font-semibold'
            )}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
            <FileText className="size-8" aria-hidden="true" />
            <p>This article has no content.</p>
          </div>
        )}
      </CardContent>

      {showAttachments && (
        <CardFooter className="flex-col items-stretch gap-3 border-t bg-muted/20 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2 font-medium">
            <Paperclip className="size-4" aria-hidden="true" />
            <span>Attachments</span>
            <Badge variant="outline">{article.attachments.length}</Badge>
          </div>

          <div className="grid gap-2">
            {article.attachments.map(attachment => {
              const downloadable = canDownloadAttachment(attachment)

              return (
                <div
                  key={attachment.sys_id}
                  className="flex min-w-0 flex-col gap-3 rounded-md border bg-background p-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={attachment.file_name}>
                      {attachment.file_name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatAttachmentSize(attachment.size_bytes)}</span>
                      <span aria-hidden="true">&bull;</span>
                      <span>{formatAttachmentState(attachment.state)}</span>
                    </div>
                  </div>

                  {downloadable ? (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={getAttachmentUrl(attachment, article)}
                        download={attachment.file_name}
                        onClick={event => onAttachmentClick?.(attachment, article, event)}
                      >
                        <Download aria-hidden="true" />
                        Download
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <Download aria-hidden="true" />
                      Unavailable
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
