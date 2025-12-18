/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react'
import type { Extension } from '@codemirror/state'
import { linter, type Diagnostic } from '@codemirror/lint'
import { HtmlValidate, type Message } from 'html-validate'

type UseHtmlLintOptions = {
  enabled: boolean
  config?: Record<string, any>
  debounceMs?: number | null
}

export function useHtmlLint(opts: UseHtmlLintOptions = { enabled: false }): {
  extensions: Extension[]
  ready: boolean
  error: string | null
} {
  const { enabled, config, debounceMs = 300 } = opts

  const validator = useMemo(() => {
    if (!enabled) return null

    const baseConfig: Record<string, any> = config ?? {
      extends: ['html-validate:recommended'],
      rules: {
        'void-style': 'off',
      }
    }

    return new HtmlValidate(baseConfig)
  }, [enabled, config])

  const extensions = useMemo<Extension[]>(() => {
    if (!enabled || !validator) return []

    const htmlLintExt = linter(
      async view => {
        const text = view.state.doc.toString()
        const result = await validator.validateString(text)

        const messages: Message[] = result.results[0]?.messages ?? []

        const diagnostics: Diagnostic[] = messages.map(msg => {
          const doc = view.state.doc

          const line = Math.max(1, msg.line ?? 1)
          const safeCol = Math.max(1, msg.column ?? 1)
          const lineInfo = doc.line(line)

          let from = lineInfo.from + (safeCol - 1)
          if (from > lineInfo.to) from = lineInfo.to
          let to = from

          if (to === from && from < lineInfo.to) to = from + 1

          return {
            from,
            to,
            message: msg.message || 'HTML error',
            severity: msg.severity === 2 ? 'error' : 'warning',
          }
        })

        return diagnostics
      },
      { delay: Math.max(0, debounceMs ?? 0) }
    )

    return [htmlLintExt]
  }, [enabled, validator, debounceMs])

  return {
    extensions,
    ready: enabled && !!validator && extensions.length > 0,
    error: null,
  }
}
