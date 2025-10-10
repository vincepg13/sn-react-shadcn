import { isAxiosError } from 'axios'
import { createPortal } from 'react-dom'
import { Minimize2 } from 'lucide-react'
import { atomone } from '@uiw/codemirror-theme-atomone'
import { getAutocompleteData } from '@kit/utils/script-editor'
import { useFormLifecycle } from '../contexts/SnFormLifecycleContext'
import { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { SnFieldBaseProps, SnFieldSchema } from '@kit/types/form-schema'
import { useFieldUI } from '@kit/components/sn-form/contexts/FieldUIContext'
import { useInlineTern } from '@kit/components/sn-ui/sn-script-editor/hooks/useTernInline'
import { useFullScreen } from '@kit/components/sn-ui/sn-script-editor/hooks/useFullScreen'
import { esLintDefaultConfig } from '@kit/components/sn-ui/sn-script-editor/hooks/useEsLint'
import { SnCodeMirror, SnCodeMirrorHandle } from '@kit/components/sn-ui/sn-script-editor/sn-code-mirror'
import { SnScriptToolbar } from '@kit/components/sn-ui/sn-script-editor/sn-script-toolbar'

interface SnFieldScriptProps extends Omit<SnFieldBaseProps<string>, 'field'> {
  field: SnFieldSchema
  table: string
  adornmentRef?: RefObject<HTMLElement | null>
}

const typeToLang: Record<string, 'javascript' | 'html' | 'css' | 'json'> = {
  script: 'javascript',
  script_plain: 'javascript',
  html_template: 'html',
  css: 'css',
  json: 'json',
  properties: 'css'
}

export function SnFieldScript({ table, field, rhfField, adornmentRef, onChange }: SnFieldScriptProps) {
  const { readonly } = useFieldUI()
  const { formConfig } = useFormLifecycle()
  const { isMaximized, toggleMax } = useFullScreen()

  const editorRef = useRef<SnCodeMirrorHandle | null>(null)
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
    () => <SnScriptToolbar readonly={readonly} toggleMax={toggleMax} editorRef={editorRef} />,
    [readonly, toggleMax]
  )

  // Maximized mode styles and behavior
  const editorHeight = isMaximized ? 'calc(100vh)' : undefined
  const wrapperClasses = isMaximized ? 'fixed inset-0 z-[1000] bg-background/95' : 'w-full overflow-x-auto'
  const esLint = {
    enabled: field.type.startsWith('script'),
    debounceMs: 200,
    config: formConfig.es_lint || esLintDefaultConfig,
  }

  return (
    <>
      <div className={wrapperClasses}>
        <SnCodeMirror
          ref={editorRef}
          language={typeToLang[field.type]}
          content={String(rhfField.value ?? '')}
          theme={atomone}
          readonly={readonly}
          height={editorHeight}
          signatureExt={signatureExt}
          completionSources={completionSources}
          onBlur={onChange}
          onToggleMax={toggleMax}
          esLint={esLint}
          lineWrapping={false}
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
