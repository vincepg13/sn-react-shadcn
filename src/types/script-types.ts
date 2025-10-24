export type CmThemeValue = 'light' | 'dark' | 'atom' | 'monokai' | 'dracula' | 'androidstudio' | 'copilot';
export type SnScriptFieldType = 'script' | 'script_plain' | 'html_template' | 'css' | 'json' | 'properties'
export type CodeMirrorLanguage = 'javascript' | 'html' | 'css' | 'json'

export interface SnCodeMirrorHandle {
  openSearch: () => void
  getValue: () => string
  setValue: (next: string) => void
  toggleMax: () => void
  toggleComment: (block?: boolean) => void
  format: () => Promise<{ changed: boolean; error?: string }>
}