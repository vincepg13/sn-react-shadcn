import { keymap } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'   // ← add this
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
  const formatNow = useCallback(async () => {
    if (isReadOnly) return { changed: false }

    const view = editorRef.current?.view
    if (!view) return { changed: false }

    const originalCode = view.state.doc.toString()
    const cursorHead = view.state.selection.main.head

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

      // Prepare source + caret for Prettier
      let codeForPrettier = originalCode
      let cursorForPrettier = cursorHead
      let willStripPrefix = false
      let prefixStart = 0
      const PREFIX = 'void '

      if (parser === 'babel') {
        const { anonTop, start } = needsSnWrapper(originalCode)
        if (anonTop) {
          codeForPrettier = addSnPrefix(originalCode, start)
          willStripPrefix = true
          prefixStart = start
          // if caret is after where we inject, shift the cursor we pass to Prettier
          if (cursorHead >= start) cursorForPrettier += PREFIX.length
        }
      }

      // ✨ Use formatWithCursor to get the new caret position
      const { formatted: rawFormatted, cursorOffset: newCursorFromPrettier } =
        await prettier.formatWithCursor(codeForPrettier, {
          parser,
          plugins,
          cursorOffset: cursorForPrettier,
          ...prettierOpts,
        })

      // Undo the temporary prefix if we added it, and remap the cursor
      let formatted = rawFormatted
      let mappedCursor = newCursorFromPrettier
      if (willStripPrefix) {
        formatted = stripSnPrefixFromFormatted(rawFormatted)
        if (newCursorFromPrettier > prefixStart) {
          mappedCursor = Math.max(prefixStart, newCursorFromPrettier - PREFIX.length)
        }
      }

      // No-op?
      if (formatted.trimEnd() === originalCode.trimEnd()) {
        onFormat?.({ changed: false })
        return { changed: false }
      }

      // Replace doc AND restore caret
      view.dispatch({
        changes: { from: 0, to: originalCode.length, insert: formatted },
        selection: EditorSelection.cursor(mappedCursor),
        scrollIntoView: true,
        userEvent: 'format',
      })
      view.focus()

      setEditorValue(formatted)
      onFormat?.({ changed: true })
      return { changed: true }
    } catch (err) {
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
