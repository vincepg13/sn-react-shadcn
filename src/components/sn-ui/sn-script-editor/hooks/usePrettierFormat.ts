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

export function usePrettierFormatter(
  isReadOnly: boolean,
  inputLang: string,
  editorRef: RefObject<ReactCodeMirrorRef | null>,
  prettierOpts: PrettierOptions = defaultPrettierConfig,
  setEditorValue: (val: string) => void,
  onFormat?: (result: { changed: boolean; error?: string }) => void
) {
  // Function to format the code using lazy-loaded Prettier
  const formatNow = useCallback(async (): Promise<{ changed: boolean; error?: string }> => {
    if (isReadOnly) return { changed: false }

    const view = editorRef.current?.view
    if (!view) return { changed: false }

    const code = view.state.doc.toString()

    try {
      const prettier = await import('prettier/standalone')

      let parser: BuiltInParserName
      let plugins: Plugin[] = []

      if (inputLang === 'javascript') {
        const [{ default: babel }, { default: estree }] = await Promise.all([
          import('prettier/plugins/babel'),
          import('prettier/plugins/estree'),
        ])
        parser = 'babel'
        plugins = [babel, estree]
      } else if (inputLang === 'html') {
        const { default: html } = await import('prettier/plugins/html')
        parser = 'html'
        plugins = [html]
      } else {
        const { default: postcss } = await import('prettier/plugins/postcss')
        parser = 'css'
        plugins = [postcss]
      }

      const formatted = await prettier.format(code, { parser, plugins, ...prettierOpts })

      if (formatted.trimEnd() === code.trimEnd()) {
        onFormat?.({ changed: false })
        return { changed: false }
      }

      view.dispatch({
        changes: { from: 0, to: code.length, insert: formatted },
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

  // Keyboard shortcut Shift+Alt+F to trigger formatting
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
