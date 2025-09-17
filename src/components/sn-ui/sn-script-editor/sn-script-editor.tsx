import { EditorView } from '@codemirror/view'
import { openSearchPanel } from '@codemirror/search'
import { Options as PrettierOptions } from 'prettier'
import { LanguageSupport } from '@codemirror/language'
import { autocompletion } from '@codemirror/autocomplete'
import { usePrettierFormatter } from './hooks/usePrettierFormat'
import { toggleLineComment, toggleBlockComment } from '@codemirror/commands'
import { startCompletion, type CompletionSource } from '@codemirror/autocomplete'
import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react'
import CodeMirror, { Extension, Prec, ReactCodeMirrorProps, ReactCodeMirrorRef } from '@uiw/react-codemirror'

interface SnScriptEditorProps {
  lang: LanguageSupport
  height?: string
  content?: string
  readonly?: boolean
  theme?: ReactCodeMirrorProps['theme']
  prettierOptions?: PrettierOptions
  signatureExt?: Extension[]
  autocompleteType?: 'default' | 'override'
  completionSource?: CompletionSource
  onBlur?: (value: string) => void
  onFormat?: (result: { changed: boolean; error?: string }) => void
}

export interface SnScriptEditorHandle {
  openSearch: () => void
  toggleComment: (block?: boolean) => void
  format: () => Promise<{ changed: boolean; error?: string }>
}

export const SnScriptEditor = forwardRef<SnScriptEditorHandle, SnScriptEditorProps>(function SnScriptEditor(
  {
    height = '400px',
    theme = 'dark',
    lang,
    content,
    readonly = false,
    prettierOptions,
    signatureExt,
    autocompleteType = 'default',
    completionSource,
    onBlur,
    onFormat,
  },
  ref
) {
  const inputLang = lang.language.name
  const [value, setValue] = useState(content)
  const editorRef = useRef<ReactCodeMirrorRef | null>(null)

  const { formatNow, formatKeymap } = usePrettierFormatter(
    readonly,
    inputLang,
    editorRef,
    prettierOptions,
    setValue,
    onFormat
  )

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

  useImperativeHandle(
    ref,
    () => ({
      format: formatNow,
      openSearch: () => {
        const view = editorRef.current?.view
        if (view) openSearchPanel(view)
      },
      toggleComment: (block?: boolean) => {
        const view = editorRef.current?.view
        if (!view) return
        if (block) toggleBlockComment({ state: view.state, dispatch: view.dispatch })
        else toggleLineComment({ state: view.state, dispatch: view.dispatch })
      },
    }),
    [formatNow]
  )

  const extraAutocomplete = useMemo<Extension | undefined>(() => {
    if (autocompleteType === 'default') {
      return completionSource ? Prec.high(lang.language.data.of({ autocomplete: completionSource })) : undefined
    } else {
      return autocompletion(
        completionSource ? { activateOnTyping: true, override: [completionSource] } : { activateOnTyping: true }
      )
    }
  }, [autocompleteType, completionSource, lang.language.data])

  const dotTrigger = Prec.high(
    EditorView.updateListener.of(u => {
      if (!u.docChanged) return
      const head = u.state.selection.main.head
      if (head > 0 && u.state.doc.sliceString(head - 1, head) === '.') {
        startCompletion(u.view)
      }
    })
  )

  const extra = useMemo(() => {
    const arr: Extension[] = []
    if (completionSource) arr.push(Prec.high(lang.language.data.of({ autocomplete: completionSource })))
    if (signatureExt?.length) arr.push(...signatureExt)
    return arr
  }, [lang, completionSource, signatureExt])

  return (
    <CodeMirror
      ref={editorRef}
      value={value}
      width="100%"
      height={height}
      theme={theme}
      readOnly={readonly}
      onChange={setValue}
      onBlur={() => onBlur?.(value || '')}
      extensions={[
        lang,
        formatKeymap,
        EditorView.lineWrapping,
        dotTrigger,
        ...extra,
        ...(extraAutocomplete ? [extraAutocomplete] : []),
      ]}
      className="w-full [&_.cm-content[aria-readonly='true']]:cursor-not-allowed"
    />
  )
})
