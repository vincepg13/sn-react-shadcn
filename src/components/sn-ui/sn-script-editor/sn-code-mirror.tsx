import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import { javascript } from '@codemirror/lang-javascript'
import { EditorView, keymap } from '@codemirror/view'
import { openSearchPanel } from '@codemirror/search'
import { Options as PrettierOptions } from 'prettier'
import { useEsLint } from './hooks/useEsLint'
import { buildAutocomplete } from '@kit/utils/script-editor'
import { usePrettierFormatter } from './hooks/usePrettierFormat'
import { indentationMarkers } from '@replit/codemirror-indentation-markers'
import { toggleBlockComment, toggleLineComment } from '@codemirror/commands'
import { startCompletion, type CompletionSource } from '@codemirror/autocomplete'
import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react'
import CodeMirror, { Extension, Prec, ReactCodeMirrorProps, ReactCodeMirrorRef } from '@uiw/react-codemirror'

interface SnCodeMirrorProps {
  language?: 'javascript' | 'html' | 'css' | 'json'
  height?: string
  content?: string
  readonly?: boolean
  theme?: ReactCodeMirrorProps['theme']
  prettierOptions?: PrettierOptions
  signatureExt?: Extension[]
  autocompleteType?: 'default' | 'override'
  completionSources?: CompletionSource[]
  esLint?: Parameters<typeof useEsLint>[0]
  lineWrapping?: boolean
  isMaximized?: boolean
  onToggleMax: () => void
  onChange?: (value: string) => void
  onBlur?: (value: string) => void
  onFormat?: (result: { changed: boolean; error?: string }) => void
}

function getLanguageSupport(lang: string) {
  switch (lang) {
    case 'javascript':
      return javascript()
    case 'html':
      return html()
    case 'css':
      return css()
    case 'json':
      return json()
    default:
      return javascript()
  }
}

export interface SnCodeMirrorHandle {
  openSearch: () => void
  getValue: () => string
  setValue: (next: string) => void
  toggleMax: () => void
  toggleComment: (block?: boolean) => void
  format: () => Promise<{ changed: boolean; error?: string }>
}

export const SnCodeMirror = forwardRef<SnCodeMirrorHandle, SnCodeMirrorProps>(function SnCodeMirror(
  {
    language,
    height = '400px',
    theme = 'dark',
    content,
    readonly = false,
    prettierOptions,
    signatureExt,
    autocompleteType = 'default',
    completionSources,
    esLint,
    lineWrapping = true,
    isMaximized,
    onBlur,
    onChange,
    onFormat,
    onToggleMax,
  },
  ref
) {
  const inputLang = language || 'javascript'
  const lang = getLanguageSupport(language || 'javascript')
  const [value, setValue] = useState(content)

  const editorRef = useRef<ReactCodeMirrorRef | null>(null)
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    if (content === undefined) return
    setValue(content)
  }, [content])

  // Setup ESLint
  const { extensions: lintExts } = useEsLint(esLint)

  // Setup Prettier formatter
  const { formatNow, formatKeymap } = usePrettierFormatter(
    readonly,
    inputLang,
    editorRef,
    prettierOptions,
    setValue,
    onFormat
  )

  // Dynamically bind editor content
  useEffect(() => {
    if (editorRef.current?.view) {
      const currentValue = editorRef.current.view.state.doc.toString()
      if (currentValue !== content) {
        editorRef.current.view.dispatch({ changes: { from: 0, to: currentValue.length, insert: content ?? '' } })
        setValue(content ?? '')
      }
    }
  }, [content])

  const handleChange = (val: string) => {
    setValue(val)
    onChange?.(val)
  }

  // Expose editor methods to parent
  useImperativeHandle(
    ref,
    () => ({
      format: formatNow,
      toggleMax: onToggleMax,
      getValue: () => valueRef.current ?? '',
      setValue: (next: string) => setValue(next),
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
    [formatNow, onToggleMax]
  )

  // Build autocomplete extensions
  const autocompleteExt = useMemo<Extension | Extension[]>(
    () => buildAutocomplete(lang, completionSources, autocompleteType),
    [lang, completionSources, autocompleteType]
  )

  // Trigger completion after "."
  const dotTrigger = Prec.high(
    EditorView.updateListener.of(u => {
      if (!u.docChanged) return
      const head = u.state.selection.main.head
      if (head > 0 && u.state.doc.sliceString(head - 1, head) === '.') startCompletion(u.view)
    })
  )

  // Build cursor in bracket based extensions for methods
  const extra = useMemo<Extension[]>(() => (signatureExt?.length ? [...signatureExt] : []), [signatureExt])

  //Full screen
  const fullscreenKeymap = useMemo(
    () =>
      Prec.highest(
        keymap.of([
          {
            key: 'Mod-m',
            run: () => {
              onToggleMax?.()
              return true
            },
          },
          {
            key: 'Escape',
            run: () => {
              if (isMaximized) {
                onToggleMax?.()
                return true
              }
              return false
            },
          },
        ])
      ),
    [isMaximized, onToggleMax]
  )

  // Combine all extensions
  const extensions: Extension[] = [
    lang,
    formatKeymap,
    dotTrigger,
    fullscreenKeymap,
    indentationMarkers({
      markerType: 'codeOnly',
      thickness: 2,
    }),
    ...extra,
    ...(Array.isArray(autocompleteExt) ? autocompleteExt : [autocompleteExt]),
  ]

  if (lineWrapping !== false) {
    extensions.push(EditorView.lineWrapping)
  }

  if (esLint?.enabled) {
    extensions.push(...(lintExts ? (Array.isArray(lintExts) ? lintExts : [lintExts]) : []))
  }

  // Send it all into CodeMirror
  return (
    <CodeMirror
      ref={editorRef}
      value={value}
      width="100%"
      height={height}
      theme={theme}
      readOnly={readonly}
      onChange={handleChange}
      onBlur={() => onBlur?.(value || '')}
      extensions={extensions}
      className="w-full [&_.cm-content[aria-readonly='true']]:cursor-not-allowed"
    />
  )
})
