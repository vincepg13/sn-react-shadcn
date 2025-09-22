/* eslint-disable @typescript-eslint/no-explicit-any */
import {browser} from 'globals'
import * as espree from 'espree'
import type { Extension } from '@codemirror/state'
import { useEffect, useMemo, useState } from 'react'
import { esLint } from '@codemirror/lang-javascript'
import { linter, lintGutter } from '@codemirror/lint'

type UseEsLintOptions = {
  enabled: boolean
  config?: any | any[]
  debounceMs?: number | null
  showGutter?: boolean
}

function getEs5Config(rules: Record<string, unknown>) {
  return {
    languageOptions: {
      parser: espree,
      ecmaVersion: 5,
      sourceType: 'script',
      globals: { ...browser },
    },
    rules,
  }
}

export const esLintDefaultConfig = {
  rules: { semi: ['warn', 'always'], 'no-unused-vars': ['warn', { args: 'none' }] },
  languageOptions: { globals: { ...browser }, parserOptions: { ecmaVersion: "latest", sourceType: 'script' } },
}

export function useEsLint(opts: UseEsLintOptions = { enabled: false }): {
  extensions: Extension[]
  ready: boolean
  error: string | null
} {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extensions, setExtensions] = useState<Extension[]>([])
  const { enabled, config, debounceMs = 300, showGutter = true } = opts

  //Revert to ES5 config if necessary
  const userConfig = useMemo(
    () => (config?.languageOptions?.parserOptions?.ecmaVersion == 5 ? getEs5Config(config.rules) : config),
    [config]
  )

  const flatConfigArray = useMemo(() => {
    const base = esLintDefaultConfig
    const merged = Array.isArray(userConfig) ? [{ ...base }, ...userConfig] : [{ ...base, ...(userConfig || {}) }]
    return merged
  }, [userConfig])

  useEffect(() => {
    let cancelled = false
    setReady(false)
    setError(null)
    setExtensions([])

    if (!enabled) return
    ;(async () => {
      try {
        const mod = await import('eslint-linter-browserify')
        const LinterCtor = (mod as any).Linter
        if (!LinterCtor) throw new Error('Failed to load ESLint Linter')

        const lintSource = esLint(new LinterCtor(), flatConfigArray) // <-- pass ARRAY

        const exts: Extension[] = [linter(lintSource, { delay: Math.max(0, debounceMs ?? 0) })]
        if (showGutter) exts.unshift(lintGutter())

        if (!cancelled) {
          setExtensions(exts)
          setReady(true)
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(String(e?.message || e))
          setExtensions([])
          setReady(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, flatConfigArray, debounceMs, showGutter])

  return { extensions, ready, error }
}
