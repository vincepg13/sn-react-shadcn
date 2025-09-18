import { isAxiosError } from 'axios'
import { createPortal } from 'react-dom'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { atomone } from '@uiw/codemirror-theme-atomone'
import { javascript } from '@codemirror/lang-javascript'
import { LanguageSupport } from '@codemirror/language'
import { getAutocompleteData } from '@kit/utils/script-editor'
import { SnSimpleTooltip } from '@kit/components/sn-ui/sn-tooltip'
import { useFormLifecycle } from '../contexts/SnFormLifecycleContext'
import { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { SnFieldBaseProps, SnFieldSchema } from '@kit/types/form-schema'
import { useFieldUI } from '@kit/components/sn-form/contexts/FieldUIContext'
import { useInlineTern } from '@kit/components/sn-ui/sn-script-editor/hooks/useTernInline'
import { useFullScreen } from '@kit/components/sn-ui/sn-script-editor/hooks/useFullScreen'
import { esLintDefaultConfig } from '@kit/components/sn-ui/sn-script-editor/hooks/useEsLint'
import { Lock, Wand2, Minimize2, SearchCode, MessageSquareCode, Maximize2 } from 'lucide-react'
import { SnScriptEditor, SnScriptEditorHandle } from '@kit/components/sn-ui/sn-script-editor/sn-script-editor'

interface SnFieldScriptProps extends Omit<SnFieldBaseProps<string>, 'field'> {
  field: SnFieldSchema
  table: string
  adornmentRef?: RefObject<HTMLElement | null>
}

const typeToLang: Record<string, LanguageSupport> = {
  script: javascript(),
  html_template: html(),
  css: css(),
}

export function SnFieldScript({ table, field, rhfField, adornmentRef, onChange }: SnFieldScriptProps) {
  const { readonly } = useFieldUI()
  const { formConfig } = useFormLifecycle()
  const { isMaximized, toggleMax } = useFullScreen()

  const editorRef = useRef<SnScriptEditorHandle | null>(null)
  const [snDefs, setSnDefs] = useState<unknown | null>(null)

  useEffect(() => {
    if (field.type == 'html_template' || field.type == 'css') return

    const controller = new AbortController()

    const loadSnDefs = async () => {
      try {
        const snCompletionSet = await getAutocompleteData(table, field.name, controller)
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
    fileName: `${field.name}.js`,
  })

  //Toolbar actions
  const Icons = useMemo(
    () => (
      <div className="flex items-center gap-3">
        <button type="button" className="hover:opacity-80" onClick={() => editorRef.current?.openSearch()}>
          <SnSimpleTooltip trigger={<SearchCode size={18} />} content="Search (Ctrl + F)" />
        </button>
        {readonly ? (
          <SnSimpleTooltip trigger={<Lock size={18} />} content="Readonly field" />
        ) : (
          <>
            <button type="button" className="hover:opacity-80" onClick={() => editorRef.current?.toggleComment()}>
              <SnSimpleTooltip trigger={<MessageSquareCode size={18} />} content="Comment (Ctrl + /)" />
            </button>
            <button type="button" className="hover:opacity-80" onClick={() => editorRef.current?.format()}>
              <SnSimpleTooltip trigger={<Wand2 size={18} />} content="Format (Shift + Alt + F)" />
            </button>
          </>
        )}
        <button type="button" className="hover:opacity-80" onClick={toggleMax}>
          <SnSimpleTooltip trigger={<Maximize2 size={18} />} content="Full screen (Ctrl + M)" />
        </button>
      </div>
    ),
    [readonly, toggleMax]
  )

  // Maximized mode styles and behavior
  const editorHeight = isMaximized ? 'calc(100vh)' : undefined
  const wrapperClasses = isMaximized ? 'fixed inset-0 z-[1000] bg-background/95' : 'w-full'
  const esLint = {
    enabled: field.type === 'script',
    debounceMs: 200,
    config: formConfig.es_lint || esLintDefaultConfig,
  }

  return (
    <>
      <div className={wrapperClasses}>
        <SnScriptEditor
          ref={editorRef}
          lang={typeToLang[field.type]}
          content={String(rhfField.value ?? '')}
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

      {adornmentRef?.current ? createPortal(Icons, adornmentRef.current) : null}
    </>
  )
}
