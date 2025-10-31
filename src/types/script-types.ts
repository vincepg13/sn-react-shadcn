export type CmThemeValue = 'light' | 'dark' | 'atom' | 'monokai' | 'dracula' | 'androidstudio' | 'copilot'
export type SnScriptFieldType = 'script' | 'script_plain' | 'html_template' | 'css' | 'json' | 'properties' | 'xml'
export type CodeMirrorLanguage = 'javascript' | 'html' | 'css' | 'json' | 'xml'

export const typeToLang: Record<SnScriptFieldType, CodeMirrorLanguage> = {
  script: 'javascript',
  script_plain: 'javascript',
  html_template: 'html',
  css: 'css',
  json: 'json',
  properties: 'css',
  xml: 'xml',
}

export interface SnCodeMirrorHandle {
  openSearch: () => void
  getValue: () => string
  setValue: (next: string) => void
  toggleMax: () => void
  toggleComment: (block?: boolean) => void
  format: () => Promise<{ changed: boolean; error?: string }>
}
