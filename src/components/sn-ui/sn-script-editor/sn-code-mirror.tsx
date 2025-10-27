import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import { tags as t } from '@lezer/highlight'
import { useEsLint } from './hooks/useEsLint'
import { lintGutter } from '@codemirror/lint'
import { EditorState } from '@codemirror/state'
import { indentUnit } from '@codemirror/language'
import { openSearchPanel } from '@codemirror/search'
import { CmThemeValue } from '@kit/types/script-types'
import { EditorView, keymap } from '@codemirror/view'
import { Options as PrettierOptions } from 'prettier'
import { javascript } from '@codemirror/lang-javascript'
import { boolColorByTheme, buildAutocomplete } from '@kit/utils/script-editor'
import { usePrettierFormatter } from './hooks/usePrettierFormat'
import { indentationMarkers } from '@replit/codemirror-indentation-markers'
import { toggleBlockComment, toggleLineComment } from '@codemirror/commands'
import { startCompletion, type CompletionSource } from '@codemirror/autocomplete'
import { HighlightStyle, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { useEffect, useRef, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react'
import CodeMirror, { Extension, Prec, ReactCodeMirrorProps, ReactCodeMirrorRef } from '@uiw/react-codemirror'

interface SnCodeMirrorProps {
  language?: 'javascript' | 'html' | 'css' | 'json'
  height?: string
  content?: string
  readonly?: boolean
  theme?: ReactCodeMirrorProps['theme']
  themeId?: CmThemeValue
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
  getRawValue: () => string
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
    themeId,
    content = '',
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
  const lang = getLanguageSupport(inputLang)

  const editorRef = useRef<ReactCodeMirrorRef | null>(null)
  const lastExternalAppliedRef = useRef<string | undefined>(undefined)
  const lastTypeTimeRef = useRef<number>(0)
  const didInitApplyRef = useRef(false)

  const markTyped = useCallback(() => {
    lastTypeTimeRef.current = performance.now()
  }, [])

  const booleanHighlightExt = useMemo(() => {
    const color = (themeId && boolColorByTheme[themeId.toLowerCase() as CmThemeValue]) || '#569CD6'
    const style = HighlightStyle.define([{ tag: t.bool, color }])
    return Prec.high(syntaxHighlighting(style))
  }, [themeId])

  const replaceDocSafely = useCallback((next: string) => {
    const view = editorRef.current?.view
    if (!view) return
    const cur = view.state.doc.toString()
    if (cur === next) return
    if (view.composing) return
    if (performance.now() - lastTypeTimeRef.current < 400) return
    const sel = view.state.selection.main
    view.dispatch({
      changes: { from: 0, to: cur.length, insert: next },
      selection: { anchor: Math.min(next.length, sel.anchor), head: Math.min(next.length, sel.head) },
      userEvent: 'external',
    })
    lastExternalAppliedRef.current = next
  }, [])

  // Wait until CM view exists, then apply initial content once.
  useEffect(() => {
    let cancelled = false
    const tryInit = () => {
      if (cancelled) return
      const view = editorRef.current?.view
      if (!view) return void requestAnimationFrame(tryInit)
      if (didInitApplyRef.current) return
      didInitApplyRef.current = true
      replaceDocSafely(String(content ?? ''))
    }
    requestAnimationFrame(tryInit)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Later updates (record switch / external load).
  useEffect(() => {
    if (!didInitApplyRef.current) return
    if (typeof content !== 'string') return
    if (content === lastExternalAppliedRef.current) return
    replaceDocSafely(String(content))
  }, [content, replaceDocSafely])

  // ESLint
  const { extensions: lintExts } = useEsLint(esLint)
  const lintGutterExts = useMemo(() => {
    if (!esLint?.enabled) return []

    const fixedWidth = EditorView.theme({
      '.cm-gutter-lint': { width: '1.25rem' },
      '.cm-gutters': { minWidth: '3.5ch' },
    })

    return [lintGutter(), fixedWidth]
  }, [esLint?.enabled])

  // Prettier
  const { formatNow, formatKeymap } = usePrettierFormatter(
    readonly,
    inputLang,
    editorRef,
    prettierOptions,
    (val: string) => onChange?.(val),
    onFormat
  )

  const tabWidth = prettierOptions?.tabWidth ?? 4
  const indentExt = [indentUnit.of(' '.repeat(tabWidth)), EditorState.tabSize.of(tabWidth)]

  // Autocomplete & helpers
  const autocompleteExt = useMemo<Extension | Extension[]>(
    () => buildAutocomplete(lang, completionSources, autocompleteType),
    [lang, completionSources, autocompleteType]
  )

  const dotTrigger = useMemo(
    () =>
      Prec.high(
        EditorView.updateListener.of(u => {
          if (!u.docChanged) return
          const head = u.state.selection.main.head
          if (head > 0 && u.state.doc.sliceString(head - 1, head) === '.') startCompletion(u.view)
        })
      ),
    []
  )

  const updatesExt = useMemo(
    () =>
      EditorView.updateListener.of(u => {
        if (u.docChanged) markTyped()
      }),
    [markTyped]
  )

  const extra = useMemo<Extension[]>(() => (signatureExt?.length ? [...signatureExt] : []), [signatureExt])

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

  const extensions: Extension[] = [
    lang,
    formatKeymap,
    dotTrigger,
    updatesExt,
    fullscreenKeymap,
    ...indentExt,
    indentationMarkers({ markerType: 'codeOnly', thickness: 2 }),
    booleanHighlightExt,
    ...extra,
    ...(Array.isArray(autocompleteExt) ? autocompleteExt : [autocompleteExt]),
    ...lintGutterExts,
  ]
  if (lineWrapping !== false) extensions.push(EditorView.lineWrapping)
  if (esLint?.enabled) extensions.push(...(Array.isArray(lintExts) ? lintExts : [lintExts]))

  extensions.push(syntaxHighlighting(defaultHighlightStyle, { fallback: true }))

  // Debounce only the parent write; let CM keep its own buffer
  const sendChangeDebounced = useDebouncedCallback((val: string) => {
    onChange?.(val)
  }, 300)
  const handleChange = (val: string) => sendChangeDebounced(val)

  useImperativeHandle(
    ref,
    () => ({
      format: formatNow,
      toggleMax: onToggleMax,
      getValue: () => editorRef.current?.view?.state.doc.toString() || '',
      getRawValue: () => editorRef.current?.view?.state.doc.toString() || '',
      setValue: next => {
        replaceDocSafely(next)
        onChange?.(next)
      },
      openSearch: () => {
        const v = editorRef.current?.view
        if (v) openSearchPanel(v)
      },
      toggleComment: block => {
        const v = editorRef.current?.view
        if (!v) return
        if (block) toggleBlockComment({ state: v.state, dispatch: v.dispatch })
        else toggleLineComment({ state: v.state, dispatch: v.dispatch })
      },
    }),
    [formatNow, onToggleMax, replaceDocSafely, onChange]
  )

  return (
    <CodeMirror
      ref={editorRef}
      /* no value => uncontrolled & fast */
      width="100%"
      height={height}
      theme={theme}
      readOnly={readonly}
      onChange={handleChange}
      onBlur={() => onBlur?.(editorRef.current?.view?.state.doc.toString() || '')}
      extensions={extensions}
      className="w-full [&_.cm-content[aria-readonly='true']]:cursor-not-allowed"
    />
  )
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => callback(...args), delay)
    },
    [callback, delay]
  )
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    []
  )
  return fn as T
}
