import { createPortal } from 'react-dom'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { RefObject, useMemo, useRef } from 'react'
import { Lock, Wand2, Minimize2 } from 'lucide-react'
import { atomone } from '@uiw/codemirror-theme-atomone'
import { javascript } from '@codemirror/lang-javascript'
import { LanguageSupport } from '@codemirror/language'
import { SnSimpleTooltip } from '@kit/components/sn-ui/sn-tooltip'
import { SnFieldBaseProps, SnFieldSchema } from '@kit/types/form-schema'
import { useFieldUI } from '@kit/components/sn-form/contexts/FieldUIContext'
import { useFullScreen } from '@kit/components/sn-ui/sn-script-editor/hooks/useFullScreen'
import { SnScriptEditor, SnScriptEditorHandle } from '@kit/components/sn-ui/sn-script-editor/sn-script-editor'

interface SnFieldScriptProps extends Omit<SnFieldBaseProps<string>, 'field'> {
  field: SnFieldSchema
  adornmentRef?: RefObject<HTMLElement | null>
}

const typeToLang: Record<string, LanguageSupport> = {
  script: javascript(),
  html_template: html(),
  css: css(),
}

export function SnFieldScript({ field, rhfField, adornmentRef, onChange }: SnFieldScriptProps) {
  const { readonly } = useFieldUI()
  const { isMaximized, toggleMax } = useFullScreen()
  const editorRef = useRef<SnScriptEditorHandle | null>(null)

  const Icons = useMemo(
    () => (
      <div className="flex items-center gap-3">
        {readonly ? (
          <SnSimpleTooltip trigger={<Lock size={18} />} content="Readonly field" />
        ) : (
          <>
            <button type="button" className="hover:opacity-80" onClick={() => editorRef.current?.format()}>
              <SnSimpleTooltip trigger={<Wand2 size={18} />} content="Format" />
            </button>
          </>
        )}
        <button type="button" className="hover:opacity-80" onClick={toggleMax}>
          <SnSimpleTooltip trigger={<Minimize2 size={18} />} content="Full screen" />
        </button>
      </div>
    ),
    [readonly, toggleMax]
  )

  // Maximized mode styles and behavior
  const editorHeight = isMaximized ? 'calc(100vh)' : undefined
  const wrapperClasses = isMaximized ? 'fixed inset-0 z-[1000] bg-background/95' : 'w-full'

  return (
    <>
      <div className={wrapperClasses}>
        <SnScriptEditor
          ref={editorRef}
          lang={typeToLang[field.type]}
          content={String(rhfField.value ?? '')}
          onBlur={onChange}
          theme={atomone}
          readonly={readonly}
          height={editorHeight}
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
