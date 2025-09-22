import { isAxiosError } from 'axios'
import { Minimize2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SnScriptToolbar } from './sn-script-toolbar'
import { atomone } from '@uiw/codemirror-theme-atomone'
import { ESLintConfigAny } from '@kit/types/es-lint-types'
import { getAutocompleteData } from '@kit/utils/script-editor'
import { SnCodeMirror, SnCodeMirrorHandle } from './sn-code-mirror'
import { useInlineTern } from '@kit/components/sn-ui/sn-script-editor/hooks/useTernInline'
import { useFullScreen } from '@kit/components/sn-ui/sn-script-editor/hooks/useFullScreen'
import { esLintDefaultConfig } from '@kit/components/sn-ui/sn-script-editor/hooks/useEsLint'

type SnScriptFieldType = 'script' | 'html_template' | 'css'
type CodeMirrorLanguage = 'javascript' | 'html' | 'css'

interface SnFieldScriptProps {
  snType: SnScriptFieldType
  table: string
  fieldName: string
  content?: string
  readonly?: boolean
  esLintConfig?: ESLintConfigAny
  onChange?: (value: string) => void
}

const typeToLang: Record<SnScriptFieldType, CodeMirrorLanguage> = {
  script: 'javascript',
  html_template: 'html',
  css: 'css',
}

export function SnScriptEditor({
  snType,
  table,
  fieldName,
  readonly,
  esLintConfig,
  content,
  onChange,
}: SnFieldScriptProps) {
  const { isMaximized, toggleMax } = useFullScreen()
  const editorRef = useRef<SnCodeMirrorHandle | null>(null)
  const [snDefs, setSnDefs] = useState<unknown | null>(null)

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
  const editorHeight = isMaximized ? 'calc(100vh)' : undefined
  const wrapperClasses = isMaximized ? 'fixed inset-0 z-[1000] bg-background/95' : 'w-full'
  const esLint = {
    enabled: true,
    debounceMs: 200,
    config: esLintConfig || esLintDefaultConfig,
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full justify-end">
        <SnScriptToolbar readonly={readonly} toggleMax={toggleMax} editorRef={editorRef} />
      </div>
      <div className={wrapperClasses}>
        <SnCodeMirror
          ref={editorRef}
          language={typeToLang[snType]}
          content={String(content ?? '')}
          theme={atomone}
          readonly={readonly}
          height={editorHeight}
          signatureExt={signatureExt}
          completionSources={completionSources}
          onBlur={onChange}
          onToggleMax={toggleMax}
          esLint={esLint}
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
