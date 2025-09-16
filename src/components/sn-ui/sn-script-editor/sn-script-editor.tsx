import { EditorView } from '@codemirror/view'
import { Options as PrettierOptions } from 'prettier'
import { LanguageSupport } from '@codemirror/language'
import { usePrettierFormatter } from './hooks/usePrettierFormat'
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import CodeMirror, { ReactCodeMirrorProps, ReactCodeMirrorRef } from '@uiw/react-codemirror'

interface SnScriptEditorProps {
  lang: LanguageSupport
  height?: string
  content?: string
  readonly?: boolean
  theme?: ReactCodeMirrorProps['theme']
  prettierOptions?: PrettierOptions
  onBlur?: (value: string) => void
  onFormat?: (result: { changed: boolean; error?: string }) => void
}

export interface SnScriptEditorHandle {
  format: () => Promise<{ changed: boolean; error?: string }>
}

export const SnScriptEditor = forwardRef<SnScriptEditorHandle, SnScriptEditorProps>(function SnScriptEditor(
  { height = '400px', theme = 'dark', lang, content, readonly = false, prettierOptions, onBlur, onFormat },
  ref
) {
  const inputLang = lang.language.name
  const [value, setValue] = useState(content)
  const editorRef = useRef<ReactCodeMirrorRef | null>(null)

  // Prettier formatting configuration
  const { formatNow, formatKeymap } = usePrettierFormatter(readonly, inputLang, editorRef, prettierOptions, setValue, onFormat)

  // Sync external content changes to the editor
  useEffect(() => {
    if (editorRef.current?.view) {
      const currentValue = editorRef.current.view.state.doc.toString()
      if (currentValue !== content) {
        editorRef.current.view.dispatch({
          changes: { from: 0, to: currentValue.length, insert: content ?? '' },
        })
        setValue(content ?? '')
      }
    }
  }, [content])

  // Expose imperative handle to trigger formatting from parent
  useImperativeHandle(ref, () => ({ format: formatNow }), [formatNow])

  return (
    <CodeMirror
      ref={editorRef}
      value={value}
      width="100%"
      height={height}
      theme={theme}
      onChange={setValue}
      onBlur={() => onBlur?.(value || '')}
      extensions={[lang, formatKeymap, EditorView.lineWrapping]}
      readOnly={readonly}
      className="w-full [&_.cm-content[aria-readonly='true']]:cursor-not-allowed"
    />
  )
})
