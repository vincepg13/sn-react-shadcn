import { keymap } from '@codemirror/view'
import { RefObject, useCallback, useMemo } from 'react'
import { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { BuiltInParserName, Plugin, Options as PrettierOptions } from 'prettier'

const defaultPrettierConfig: PrettierOptions = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  printWidth: 100,
}

function needsSnWrapper(src: string) {
  const leadRe = /^(?:\uFEFF|\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*/
  const m = src.match(leadRe)
  const start = m ? m[0].length : 0
  const head = src.slice(start)
  const anonTop = /^(?:async\s+)?function\*?\s*\(/.test(head)
  return { anonTop, start }
}

function addSnPrefix(src: string, start: number) {
  return src.slice(0, start) + 'void ' + src.slice(start)
}

function stripSnPrefixFromFormatted(formatted: string) {
  // remove void at the start of file, even if indented, spaced, or newline-separated
  return formatted.replace(/^(\s*)(?:void\s+)(?=(?:async\s+)?function\*?\s*\()/m, '$1')
}

export function usePrettierFormatter(
  isReadOnly: boolean,
  inputLang: string,
  editorRef: RefObject<ReactCodeMirrorRef | null>,
  prettierOpts: PrettierOptions = defaultPrettierConfig,
  setEditorValue: (val: string) => void,
  onFormat?: (result: { changed: boolean; error?: string }) => void
) {
  const formatNow = useCallback(async (): Promise<{ changed: boolean; error?: string }> => {
    if (isReadOnly) return { changed: false }

    const view = editorRef.current?.view
    if (!view) return { changed: false }

    const originalCode = view.state.doc.toString()

    try {
      const prettier = await import('prettier/standalone')

      let parser: BuiltInParserName
      let plugins: Plugin[] = []

      if (inputLang === 'json') {
        const [{ default: babel }, { default: estree }] = await Promise.all([
          import('prettier/plugins/babel'),
          import('prettier/plugins/estree'),
        ])
        parser = 'json'
        plugins = [babel, estree]
      } else if (inputLang === 'html') {
        const { default: html } = await import('prettier/plugins/html')
        parser = 'html'
        plugins = [html]
      } else if (inputLang === 'css') {
        const { default: postcss } = await import('prettier/plugins/postcss')
        parser = 'css'
        plugins = [postcss]
      } else {
        const [{ default: babel }, { default: estree }] = await Promise.all([
          import('prettier/plugins/babel'),
          import('prettier/plugins/estree'),
        ])
        parser = 'babel'
        plugins = [babel, estree]
      }

      let codeForPrettier = originalCode
      let willStripPrefix = false

      // Only wrap JS-like files when anonymous top-level function detected
      if (parser === 'babel') {
        const { anonTop, start } = needsSnWrapper(originalCode)
        if (anonTop) {
          codeForPrettier = addSnPrefix(originalCode, start)
          willStripPrefix = true
        }
      }

      let formatted = await prettier.format(codeForPrettier, {
        parser,
        plugins,
        ...prettierOpts,
      })

      if (willStripPrefix) {
        formatted = stripSnPrefixFromFormatted(formatted)
      }

      // Avoid triggering updates for no-op formatting
      if (formatted.trimEnd() === originalCode.trimEnd()) {
        onFormat?.({ changed: false })
        return { changed: false }
      }

      view.dispatch({
        changes: { from: 0, to: originalCode.length, insert: formatted },
      })

      setEditorValue(formatted)
      onFormat?.({ changed: true })
      return { changed: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      onFormat?.({ changed: false, error: message })
      return { changed: false, error: message }
    }
  }, [isReadOnly, editorRef, inputLang, prettierOpts, setEditorValue, onFormat])

  const formatKeymap = useMemo(
    () =>
      keymap.of([
        {
          key: 'Shift-Alt-f',
          preventDefault: true,
          run: () => {
            void formatNow()
            return true
          },
        },
      ]),
    [formatNow]
  )

  return { formatNow, formatKeymap }
}
