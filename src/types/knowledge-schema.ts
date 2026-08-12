export type SnKbAttachmentState = 'available' | 'available_conditionally' | 'not_available' | 'pending'

export interface SnKbAttachment {
  sys_id: string
  file_name: string
  size_bytes: string
  state: SnKbAttachmentState
}

export interface SnKbField {
  display_value: string
  label: string
  name: string
  type: string
  value: string
}

export interface SnKbLanguage {
  label: string
  language: string
  sys_id: string
}

export interface SnKbArticle {
  content: string
  template: boolean
  number: string
  sys_id: string
  short_description: string
  display_attachments: boolean
  attachments: SnKbAttachment[]
  embedded_content: SnKbAttachment[]
  fields?: Record<string, SnKbField>
  language?: string
  languages?: SnKbLanguage[]
  template_table?: string
}

export interface SnKbSearchOptions {
  id: string
  rank: number
}

export interface SnKbArticleRequestOptions {
  fields?: string[]
  language?: string
  search?: SnKbSearchOptions
  apiVersion?: string
  updateView?: boolean
  signal?: AbortSignal
}
