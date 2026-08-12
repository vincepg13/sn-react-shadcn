import { getAxiosInstance } from './axios-client'
import type { SnKbArticle, SnKbArticleRequestOptions, SnKbAttachment } from '../types/knowledge-schema'

type KnowledgeArticleResponse = {
  result?: Partial<SnKbArticle>
}

function getKnowledgeArticlesPath(apiVersion?: string) {
  const version = apiVersion?.trim().replace(/^\/+|\/+$/g, '')
  const versionPath = version ? `${encodeURIComponent(version)}/` : ''

  return `/api/sn_km_api/${versionPath}knowledge/articles`
}

function normalizeAttachments(attachments: SnKbAttachment[] | undefined) {
  return Array.isArray(attachments) ? attachments : []
}

function normalizeKnowledgeArticle(result: Partial<SnKbArticle> | undefined): SnKbArticle {
  if (!result || typeof result.sys_id !== 'string' || !result.sys_id) {
    throw new Error('The Knowledge API returned an invalid article response')
  }

  return {
    ...result,
    content: typeof result.content === 'string' ? result.content : '',
    template: result.template === true,
    number: typeof result.number === 'string' ? result.number : '',
    sys_id: result.sys_id,
    short_description: typeof result.short_description === 'string' ? result.short_description : '',
    display_attachments: result.display_attachments === true,
    attachments: normalizeAttachments(result.attachments),
    embedded_content: normalizeAttachments(result.embedded_content),
  }
}

export function getKnowledgeAttachmentUrl(articleSysId: string, attachmentSysId: string, apiVersion?: string) {
  return `${getKnowledgeArticlesPath(apiVersion)}/${encodeURIComponent(articleSysId)}/attachments/${encodeURIComponent(attachmentSysId)}`
}

export async function getKnowledgeArticle(
  articleId: string,
  { fields, language, search, apiVersion, updateView = true, signal }: SnKbArticleRequestOptions = {}
): Promise<SnKbArticle> {
  const normalizedArticleId = articleId.trim()
  if (!normalizedArticleId) throw new Error('An article ID or KB number is required')

  const params: Record<string, string | number> = {}
  const normalizedFields = fields?.map(field => field.trim()).filter(Boolean)

  if (normalizedFields?.length) params.fields = normalizedFields.join(',')
  if (language?.trim()) params.language = language.trim()

  if (search) {
    params.search_id = search.id
    params.search_rank = search.rank
  } else if (updateView) {
    params.update_view = 'true'
  }

  const axios = getAxiosInstance()
  const response = await axios.get<KnowledgeArticleResponse>(
    `${getKnowledgeArticlesPath(apiVersion)}/${encodeURIComponent(normalizedArticleId)}`,
    { params, signal }
  )

  return normalizeKnowledgeArticle(response.data?.result)
}
