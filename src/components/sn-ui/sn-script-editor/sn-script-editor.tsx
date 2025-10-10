import { cn } from '@kit/lib/utils'
import { isAxiosError } from 'axios'
import { Minimize2 } from 'lucide-react'
import { SnScriptToolbar } from './sn-script-toolbar'
import { atomone } from '@uiw/codemirror-theme-atomone'
import { ESLintConfigAny } from '@kit/types/es-lint-types'
import { getAutocompleteData } from '@kit/utils/script-editor'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { SnCodeMirror, SnCodeMirrorHandle } from './sn-code-mirror'
import { useInlineTern } from '@kit/components/sn-ui/sn-script-editor/hooks/useTernInline'
import { useFullScreen } from '@kit/components/sn-ui/sn-script-editor/hooks/useFullScreen'
import { esLintDefaultConfig } from '@kit/components/sn-ui/sn-script-editor/hooks/useEsLint'

type SnScriptFieldType = 'script' | 'script_plain' | 'html_template' | 'css' | 'json' | 'properties'
type CodeMirrorLanguage = 'javascript' | 'html' | 'css' | 'json'

interface SnFieldScriptProps {
  snType: SnScriptFieldType
  table: string
  fieldName: string
  height?: string
  content?: string
  readonly?: boolean
  esLintConfig?: ESLintConfigAny
  customToolbar?: ReactNode | null
  parentClasses?: string
  cmContainerClasses?: string
  lineWrapping?: boolean
  onBlur?: (value: string) => void
  onChange?: (value: string) => void
  onReady?: (handle: SnCodeMirrorHandle) => void
}

const typeToLang: Record<SnScriptFieldType, CodeMirrorLanguage> = {
  script: 'javascript',
  script_plain: 'javascript',
  html_template: 'html',
  css: 'css',
  json: 'json',
  properties: 'css',
}

export function SnScriptEditor({
  snType,
  table,
  fieldName,
  height,
  readonly,
  esLintConfig,
  content,
  lineWrapping,
  customToolbar,
  parentClasses,
  cmContainerClasses,
  onChange,
  onReady,
  onBlur,
}: SnFieldScriptProps) {
  const lang = typeToLang[snType]
  const { isMaximized, toggleMax } = useFullScreen()
  const editorRef = useRef<SnCodeMirrorHandle | null>(null)
  const [snDefs, setSnDefs] = useState<unknown | null>(null)

  useEffect(() => {
    if (editorRef.current) onReady?.(editorRef.current)
  }, [onReady])

  useEffect(() => {
    if (snType === 'html_template' || snType === 'css') return

    const controller = new AbortController()

    const loadSnDefs = async () => {
      try {
        const snCompletionSet = await getAutocompleteData(table, fieldName, controller)
        setSnDefs(snCompletionSet)
      } catch (e) {
        if (isAxiosError(e) && e.code === 'ERR_CANCELED') return
        console.error('Error loading autocomplete data', e)
      }
    }

    loadSnDefs()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { completionSources, signatureExt } = useInlineTern({
    serviceNowDefs: snDefs,
    fileName: `${fieldName}.js`,
  })

  // Maximized mode styles and behavior
  const editorHeight = isMaximized ? 'calc(100vh)' : height
  const wrapperClasses = isMaximized ? 'fixed inset-0 z-[1000] bg-background/95' : cn('w-full', cmContainerClasses)

  const esLint = {
    enabled: lang === 'javascript',
    debounceMs: 200,
    config: esLintConfig || esLintDefaultConfig,
  }

  return (
    <div className={cn('flex flex-col gap-2', parentClasses)}>
      {customToolbar === null && null}
      {!!customToolbar && customToolbar}
      {customToolbar === undefined && (
        <div className="flex w-full justify-end">
          <SnScriptToolbar readonly={readonly} toggleMax={toggleMax} editorRef={editorRef} />
        </div>
      )}

      <div className={wrapperClasses}>
        <SnCodeMirror
          ref={editorRef}
          language={lang}
          content={String(content ?? '')}
          theme={atomone}
          readonly={readonly}
          height={editorHeight}
          signatureExt={signatureExt}
          completionSources={completionSources}
          lineWrapping={lineWrapping}
          esLint={esLint}
          isMaximized={isMaximized}
          onBlur={onBlur}
          onChange={onChange}
          onToggleMax={toggleMax}
        />
        {isMaximized && (
          <button
            type="button"
            onClick={toggleMax}
            className="absolute top-3 right-3 inline-flex items-center rounded-md px-2 py-1 text-sm hover:opacity-80"
            aria-label="Exit full screen"
            title="Exit full screen (Esc)"
          >
            <Minimize2 size={18} className="text-gray-300" />
          </button>
        )}
      </div>
    </div>
  )
}
