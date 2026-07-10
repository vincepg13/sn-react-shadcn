import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { cn } from '../../lib/utils'
import { getKnowledgeArticle, getKnowledgeAttachmentUrl } from '../../utils/knowledge-api'
import { SnKbContentViewer, type SnKbContentViewerProps } from './sn-kb-content-viewer'
import type { SnKbArticle, SnKbSearchOptions } from '../../types/knowledge-schema'

export interface SnKbContentWrapperProps extends Omit<SnKbContentViewerProps, 'article'> {
  articleId: string
  fields?: string[]
  language?: string
  search?: SnKbSearchOptions
  apiVersion?: string
  updateView?: boolean
  onLoad?: (article: SnKbArticle) => void
  onError?: (error: unknown) => void
}

function getKnowledgeErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.error?.message
    if (typeof responseMessage === 'string' && responseMessage) return responseMessage
    if (error.response?.status === 401 || error.response?.status === 403) {
      return 'You do not have permission to view this knowledge article.'
    }
    if (error.response?.status === 404) return 'The requested knowledge article could not be found.'
    if (error.message) return error.message
  }

  if (error instanceof Error && error.message) return error.message
  return 'An unexpected error occurred while loading the knowledge article.'
}

function SnKbContentSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('w-full gap-0 overflow-hidden rounded-md py-0', className)} aria-busy="true">
      <CardHeader className="border-b px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-2/3 max-w-xl" />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 py-6 sm:px-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-6 h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-32 w-full" />
      </CardContent>
      <CardFooter className="gap-3 border-t px-4 py-4 sm:px-6">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-28" />
      </CardFooter>
    </Card>
  )
}

export function SnKbContentWrapper({
  articleId,
  fields,
  language,
  search,
  apiVersion,
  updateView = true,
  className,
  getAttachmentUrl,
  onAttachmentClick,
  onLoad,
  onError,
}: SnKbContentWrapperProps) {
  const [article, setArticle] = useState<SnKbArticle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const fetchIdRef = useRef(0)
  const onLoadRef = useRef(onLoad)
  const onErrorRef = useRef(onError)

  const fieldsKey =
    fields
      ?.map(field => field.trim())
      .filter(Boolean)
      .join(',') ?? ''
  const searchId = search?.id
  const searchRank = search?.rank

  useEffect(() => {
    onLoadRef.current = onLoad
  }, [onLoad])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    const controller = new AbortController()
    const fetchId = ++fetchIdRef.current

    setLoading(true)
    setError(null)
    setArticle(null)

    const fetchArticle = async () => {
      try {
        const result = await getKnowledgeArticle(articleId, {
          fields: fieldsKey ? fieldsKey.split(',') : undefined,
          language,
          search: searchId !== undefined && searchRank !== undefined ? { id: searchId, rank: searchRank } : undefined,
          apiVersion,
          updateView,
          signal: controller.signal,
        })

        if (fetchId !== fetchIdRef.current) return
        setArticle(result)
        onLoadRef.current?.(result)
      } catch (fetchError: unknown) {
        if (axios.isAxiosError(fetchError) && fetchError.code === 'ERR_CANCELED') return
        if (fetchId !== fetchIdRef.current) return

        setError(getKnowledgeErrorMessage(fetchError))
        onErrorRef.current?.(fetchError)
      } finally {
        if (fetchId === fetchIdRef.current) setLoading(false)
      }
    }

    fetchArticle()

    return () => controller.abort()
  }, [articleId, fieldsKey, language, searchId, searchRank, apiVersion, updateView, retryCount])

  if (loading) return <SnKbContentSkeleton className={className} />

  if (error || !article) {
    return (
      <Alert variant="destructive" className={cn('sn-kb-content-error', className)}>
        <AlertCircle className="size-4" />
        <AlertTitle>Unable to load article</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>{error || 'The Knowledge API did not return an article.'}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setRetryCount(count => count + 1)}>
            <RotateCcw aria-hidden="true" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const resolvedAttachmentUrl =
    getAttachmentUrl ??
    ((attachment: SnKbArticle['attachments'][number], currentArticle: SnKbArticle) =>
      getKnowledgeAttachmentUrl(currentArticle.sys_id, attachment.sys_id, apiVersion))

  return (
    <SnKbContentViewer
      article={article}
      className={className}
      getAttachmentUrl={resolvedAttachmentUrl}
      onAttachmentClick={onAttachmentClick}
    />
  )
}
